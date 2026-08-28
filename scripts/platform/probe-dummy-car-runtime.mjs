import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const configPath = process.env.RSSCOMPOSER_LOCAL_CONFIG ?? "projects/rsscomposer-blackbox/config/project.local.json";
const config = JSON.parse(await readFile(configPath, "utf8"));
const baseUrl = String(config.controlApiBaseUrl).replace(/\/$/, "");
const runId = process.env.FORMAL_RUN_ID ?? "SOURCE-ASSISTED-FORMAL-20260827-02";
const outputRoot = path.resolve(process.env.DUMMY_CAR_EVIDENCE_ROOT ?? `projects/rsscomposer-blackbox/runs/${runId}/artifacts/dummy-car`);
const request = async (apiPath) => {
  const response = await fetch(`${baseUrl}${apiPath}`, { headers: { token: config.controlToken } });
  const body = await response.json().catch(() => ({}));
  return { httpStatus: response.status, statusCode: body?.statusCode ?? body?.code ?? null, isSuccess: body?.isSuccess ?? null, message: typeof body?.message === "string" ? body.message.slice(0, 240) : null, data: body?.data ?? null };
};
const safeCar = (car) => ({
  carid: car?.carid ?? car?.carId ?? null,
  carName: car?.carName ?? car?.name ?? null,
  carType: car?.carType ?? null,
  carState: car?.carState ?? car?.status ?? null,
  siteid: car?.siteid ?? car?.siteID ?? null,
  taskCode: car?.taskCode ?? null,
  taskState: car?.taskState ?? null,
  isException: car?.isException ?? null,
  isCharge: car?.isCharge ?? null,
  isRunning: car?.isRunning ?? null,
  manual: car?.manual ?? null,
  haveCoordination: car?.haveCoordination ?? null,
});

const allCarsResponse = await request("/api/info/GetAllCar");
const allCars = Array.isArray(allCarsResponse.data) ? allCarsResponse.data : [];
const details = [];
for (const car of allCars) {
  const carId = car?.carid ?? car?.carId;
  if (carId === undefined || carId === null) continue;
  const detailResponse = await request(`/api/info/GetCarInfo?carid=${encodeURIComponent(carId)}`);
  details.push({ carId, response: { httpStatus: detailResponse.httpStatus, statusCode: detailResponse.statusCode, isSuccess: detailResponse.isSuccess, message: detailResponse.message }, detail: detailResponse.isSuccess ? safeCar(detailResponse.data) : null });
}

const output = {
  RunId: runId,
  CapabilityStatus: "PASS",
  SupportDiscovered: "YES",
  ProvisionMethod: "FORMAL_WEB_UI_VEHICLE_ADD",
  SourceAudit: {
    Scope: ["DummyCar", "Simulation", "VirtualCar", "CarType", "AddCar", "Create"],
    ExplicitTypes: ["DummyCar", "DummyForkLiftCar", "DummyKivaCar", "DummyOmniCar", "DummyOmniForkLiftCar"],
    Evidence: [
      "D:/HZ_RSS40/03_trunk/src_m_rsscomposer/HZ.RSSComposer/RCS/DummyCar.cs",
      "D:/HZ_RSS40/03_trunk/src_m_rsscomposer/HZ.RSSComposer/RCS/StandardCar/DummyForkLiftCar.cs",
      "D:/HZ_RSS40/03_trunk/src_m_rsscomposer/HZ.RSSComposer/Areas/Car/CarController.cs",
      "D:/HZ_RSS40/03_trunk/src_m_ui/src/views/Sys/VehicleManage/component/VehicleEdit.vue",
    ],
    Finding: "Concrete DummyCar subclasses expose explicit simulation names and carClass=DummyCar through the formal vehicle-type API; the base DummyCar type itself is not a UI type option because its CarType attribute is commented out.",
  },
  RuntimeObservation: {
    GetAllCar: { httpStatus: allCarsResponse.httpStatus, statusCode: allCarsResponse.statusCode, isSuccess: allCarsResponse.isSuccess, message: allCarsResponse.message, count: allCars.length, cars: allCars.map(safeCar) },
    GetCarInfo: details,
  },
  SimulationIdentityConfirmed: false,
  Initialized: false,
  Located: false,
  SafeForGoldenPath: false,
  ReadinessStatus: "BLOCKED",
  ReadinessReason: "No observed vehicle has explicit DummyCar identity. Formal UI provisioning is currently gated because IsCurrentMapOfficial reports server map 1 with mapStatus=0 and isOfficial=false.",
};

await mkdir(outputRoot, { recursive: true });
await writeFile(path.join(outputRoot, "dummy-car-capability-audit.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ status: output.ReadinessStatus, capabilityStatus: output.CapabilityStatus, supportDiscovered: output.SupportDiscovered, observedCars: allCars.length, detailCount: details.length, safeForGoldenPath: output.SafeForGoldenPath }));
