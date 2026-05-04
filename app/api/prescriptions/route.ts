/**
 * GET /api/prescriptions  — list all prescriptions for the current owner
 * POST /api/prescriptions/[id]/action — record approve/modify/reject
 *
 * The /prescriptions page polls this on mount + after each model turn to
 * pick up new cards as the model emits them via the propose_prescription tool.
 */

import { listPrescriptions, getOrCreateSkillRun } from "@/lib/db";

export async function GET() {
  const intakeRun = getOrCreateSkillRun("business-intake");
  const prescriptionRun = getOrCreateSkillRun("prescription-engine");

  const fromIntake = listPrescriptions(intakeRun);
  const fromPresEngine = listPrescriptions(prescriptionRun);

  return Response.json({
    prescriptions: [...fromIntake, ...fromPresEngine],
  });
}
