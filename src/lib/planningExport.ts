import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { PlanningPhase, PlanningTask } from "@/hooks/usePlanningData";

function addDaysToDate(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function statusLabel(s: string) {
  return s === "done" ? "Terminé" : s === "active" ? "En cours" : "À venir";
}

interface ExportData {
  phases: PlanningPhase[];
  tasks: PlanningTask[];
  startDate: Date;
  versionName: string;
  projectName?: string;
}

function buildRows(data: ExportData) {
  const rows: { phase: string; task: string; start: string; end: string; duration: string; status: string; deliverable: string }[] = [];

  for (const phase of data.phases) {
    const phaseTasks = data.tasks
      .filter((t) => t.phaseId === phase.id)
      .sort((a, b) => a.startDay - b.startDay);

    for (const t of phaseTasks) {
      const start = addDaysToDate(data.startDate, t.startDay);
      const end = addDaysToDate(data.startDate, t.startDay + t.duration);
      rows.push({
        phase: phase.name,
        task: t.name,
        start: fmtDate(start),
        end: fmtDate(end),
        duration: `${t.duration}j`,
        status: statusLabel(t.status),
        deliverable: t.deliverable || "",
      });
    }
  }
  return rows;
}

export function exportPlanningToPDF(data: ExportData) {
  const doc = new jsPDF({ orientation: "landscape" });
  const title = data.projectName
    ? `Planning — ${data.projectName}`
    : "Planning";

  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Version : ${data.versionName}  |  Exporté le ${fmtDate(new Date())}`, 14, 22);
  doc.setTextColor(0);

  const rows = buildRows(data);

  autoTable(doc, {
    startY: 28,
    head: [["Phase", "Tâche", "Début", "Fin", "Durée", "Statut", "Livrable"]],
    body: rows.map((r) => [r.phase, r.task, r.start, r.end, r.duration, r.status, r.deliverable]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 35 },
      1: { cellWidth: 55 },
      6: { fontStyle: "italic" },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didParseCell: (hookData) => {
      if (hookData.column.index === 5) {
        const val = hookData.cell.raw as string;
        if (val === "Terminé") hookData.cell.styles.textColor = [22, 163, 74];
        else if (val === "En cours") hookData.cell.styles.textColor = [59, 130, 246];
        else hookData.cell.styles.textColor = [156, 163, 175];
      }
    },
  });

  // Summary footer
  const totalDays = data.tasks.length > 0
    ? Math.max(...data.tasks.map((t) => t.startDay + t.duration))
    : 0;
  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `${data.phases.length} phases · ${data.tasks.length} tâches · ${totalDays} jours`,
    14,
    finalY + 8,
  );

  const filename = data.projectName
    ? `planning-${data.projectName.replace(/\s+/g, "-").toLowerCase()}.pdf`
    : "planning.pdf";
  doc.save(filename);
}

export function exportPlanningToExcel(data: ExportData) {
  const rows = buildRows(data);

  const wsData = [
    ["Phase", "Tâche", "Début", "Fin", "Durée", "Statut", "Livrable"],
    ...rows.map((r) => [r.phase, r.task, r.start, r.end, r.duration, r.status, r.deliverable]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = [
    { wch: 25 },
    { wch: 40 },
    { wch: 14 },
    { wch: 14 },
    { wch: 8 },
    { wch: 12 },
    { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Planning");

  // Add a summary sheet
  const summaryData = [
    ["Projet", data.projectName || "Autonome"],
    ["Version", data.versionName],
    ["Date export", fmtDate(new Date())],
    ["Phases", data.phases.length.toString()],
    ["Tâches", data.tasks.length.toString()],
    [
      "Durée totale",
      data.tasks.length > 0
        ? `${Math.max(...data.tasks.map((t) => t.startDay + t.duration))} jours`
        : "0 jours",
    ],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 15 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Résumé");

  const filename = data.projectName
    ? `planning-${data.projectName.replace(/\s+/g, "-").toLowerCase()}.xlsx`
    : "planning.xlsx";
  XLSX.writeFile(wb, filename);
}
