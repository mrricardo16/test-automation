import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const configPath = process.env.RSSCOMPOSER_LOCAL_CONFIG ?? "projects/rsscomposer-blackbox/config/project.local.json";
const config = JSON.parse(await readFile(configPath, "utf8"));
const baseUrl = String(config.controlApiBaseUrl).replace(/\/$/, "");
const runId = process.env.FORMAL_RUN_ID ?? "SOURCE-ASSISTED-FORMAL-20260827-02";
const mapCode = process.env.TEST_MAP_CODE ?? "AT_0827_02_MAP";
const carId = Number(process.env.TEST_DUMMY_CAR_ID ?? 1901);
const carName = process.env.TEST_DUMMY_CAR_NAME ?? "AT_0827_02_DUMMY";
const outputRoot = path.resolve(process.env.DUMMY_CAR_EVIDENCE_ROOT ?? `projects/rsscomposer-blackbox/runs/${runId}/artifacts/dummy-car`);

const call = async (method, apiPath, body) => {
  const response = await fetch(`${baseUrl}${apiPath}`, {
    method,
    headers: { token: config.controlToken, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const responseBody = await response.json().catch(() => ({}));
  return { httpStatus: response.status, statusCode: responseBody?.statusCode ?? responseBody?.code ?? null, isSuccess: responseBody?.isSuccess ?? null, message: typeof responseBody?.message === "string" ? responseBody.message.slice(0, 240) : null, data: responseBody?.data ?? null };
};
const safeCar = (car) => ({ carid: car?.carid ?? car?.carId ?? null, carName: car?.carName ?? car?.name ?? null, siteid: car?.siteid ?? car?.siteID ?? null, taskCode: car?.taskCode ?? null, isException: car?.isException ?? null, isRunning: car?.isRunning ?? null, haveCoordination: car?.haveCoordination ?? null });
const safeTypes = (data) => (Array.isArray(data) ? data : []).map((item) => ({ label: item?.label ?? null, value: item?.value ?? item?.codeName ?? null, codeName: item?.codeName ?? null, typeName: item?.typeName ?? null, carClass: item?.carClass ?? null, carSubClass: item?.carSubClass ?? null }));

const evidence = { RunId: runId, MapCode: mapCode, CarId: carId, CarName: carName, Status: "BLOCKED", ProvisionMethod: "FORMAL_CONTROL_API_ADD_CAR", CleanupRequired: true };
const officialMap = await call("GET", "/api/Map/IsCurrentMapOfficial");
evidence.ActiveMapObservation = officialMap;
const typesResponse = await call("GET", "/api/Car/GetPageCarClassName");
evidence.CarTypeQuery = { httpStatus: typesResponse.httpStatus, statusCode: typesResponse.statusCode, isSuccess: typesResponse.isSuccess, message: typesResponse.message, options: safeTypes(typesResponse.data) };
const dummyType = safeTypes(typesResponse.data).find((item) => Number(item.carClass) === 1 && /模拟|dummy|simulated/i.test(`${item.label} ${item.value} ${item.typeName}`));
if (!dummyType) {
  evidence.Reason = "No explicit DummyCar type was returned by the formal vehicle-type API.";
  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, "dummy-car-api-provisioning.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ status: evidence.Status, reason: evidence.Reason }));
  process.exitCode = 0;
} else if (officialMap.data?.mapCode !== mapCode || officialMap.data?.isOfficial !== true) {
  evidence.Reason = "Formal AddCar is gated because the server does not report the requested map as the official active map.";
  evidence.SelectedDummyType = dummyType;
  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, "dummy-car-api-provisioning.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ status: evidence.Status, reason: evidence.Reason, activeMap: officialMap.data ?? null }));
  process.exitCode = 0;
} else {
  evidence.SelectedDummyType = dummyType;
  const payload = {
    cn_n_carid: carId,
    cn_s_map_code: mapCode,
    cn_s_name: carName,
    cn_s_code_name: dummyType.value,
    cn_n_type: 0,
    cn_n_speed: 1000,
    cn_d_capacity: 0,
    cn_d_voltage: 0,
    cn_s_address: "127.0.0.1",
    cn_s_state: "离线",
    cn_s_layer_name: "g",
    cn_s_fileds: "{}",
    cn_n_carClass: Number(dummyType.carClass),
    cn_n_carSubClass: Number(dummyType.carSubClass),
    cn_s_envelopSetting: JSON.stringify({ lengthX: 2300, lengthY: 1200, centerX: -600, centerY: 0 }),
    cn_s_envelopSettingLoad: JSON.stringify({ lengthX: 2300, lengthY: 1200, centerX: -600, centerY: 0 }),
    cn_s_carSetting: JSON.stringify({ wheelbase: 1440, car_length: 1050, car_width: 1100, car_forklen: 680, car_forkwidth: 185, car_forkhead: 470, anchorX: 0, anchorY: 0 }),
    cn_n_site_id: -1,
    cn_f_th: 0,
    cn_s_logo: "",
    cn_b_have_coordination: false,
  };
  evidence.Request = { method: "POST", path: `/api/Car/AddCar?mapCode=${mapCode}`, payload };
  evidence.AddResponse = await call("POST", `/api/Car/AddCar?mapCode=${encodeURIComponent(mapCode)}`, payload);
  evidence.Status = evidence.AddResponse.isSuccess === true && evidence.AddResponse.httpStatus < 400 ? "PASS" : "BLOCKED";
  evidence.Reason = evidence.Status === "PASS" ? "TEST_OWNED DummyCar record accepted by the formal AddCar API; runtime initialization is verified separately after Web UI refresh." : "Formal AddCar rejected the TEST_OWNED DummyCar request.";
  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, "dummy-car-api-provisioning.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ status: evidence.Status, carId, carName, selectedDummyType: dummyType.value, message: evidence.AddResponse.message }));
}
