import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const projectRoot = path.join(root, 'projects', 'rsscomposer-blackbox');
const runRoot = path.join(projectRoot, 'runs', 'MENU-COVERAGE-EXPANSION-20260827-01');
const artifactRoot = path.join(runRoot, 'artifacts', 'form-discovery');
const config = JSON.parse(await readFile(path.join(projectRoot, 'config', 'project.local.json'), 'utf8'));
const menus = [
  ['策略管理', '场景管理', '/Sys/StrategyManage'],
  ['进程管理', '场景管理', '/Sys/MissionManage'],
  ['维护任务', '任务模型', '/Task/TaskMaintanance'],
  ['任务模板', '任务模型', '/Task/TaskTemManage'],
  ['模板项管理', '任务模型', '/Task/TaskTemItemManage'],
  ['角色管理', '系统管理', '/Employee/Role'],
  ['菜单管理', '系统管理', '/Employee/Menu'],
  ['字典管理', '系统管理', '/Employee/DictManager'],
  ['外部系统配置', '系统管理', '/Employee/ExSystemManager'],
];
const runtimeBaseUrl = config.runtimeBaseUrl.endsWith('/') ? config.runtimeBaseUrl : `${config.runtimeBaseUrl}/`;
await mkdir(artifactRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

await page.goto(`${runtimeBaseUrl}#/login?redirect=/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.getByPlaceholder('用户名').fill(config.authentication.admin.username);
await page.getByPlaceholder('用户密码').fill(config.authentication.admin.password);
const loginResponse = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().includes('/Account/Login'), { timeout: 30_000 });
await page.getByRole('button').filter({ hasText: /登\s*录/ }).click();
await loginResponse;
await page.waitForURL('**/#/dashboard', { timeout: 30_000 });

const result = [];
for (const [name, module, route] of menus) {
  const row = { MenuName: name, ModuleName: module, Route: route, NewButtonFound: false, DialogFound: false, Fields: [], Screenshot: null, Error: null };
  try {
    await page.goto(`${runtimeBaseUrl}#/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const parent = page.getByRole('menuitem', { name: module, exact: true }).first();
    if ((await parent.getAttribute('aria-expanded')) !== 'true') await parent.click({ force: true });
    await page.getByRole('menu').first().getByRole('link', { name, exact: true }).click({ force: true });
    await page.waitForFunction((target) => window.location.hash === `#${target}`, route, { timeout: 15_000 });
    const add = page.getByRole('button', { name: '新增', exact: true }).first();
    row.NewButtonFound = await add.count() > 0;
    if (row.NewButtonFound) {
      await add.click();
      const dialog = page.getByRole('dialog').last();
      row.DialogFound = await dialog.count() > 0;
      if (row.DialogFound) {
        await dialog.waitFor({ state: 'visible', timeout: 10_000 });
        row.Fields = await dialog.locator('input, textarea, [role="combobox"]').evaluateAll((elements) => elements.map((element) => ({ tag: element.tagName, type: element.getAttribute('type'), placeholder: element.getAttribute('placeholder'), ariaLabel: element.getAttribute('aria-label'), name: element.getAttribute('name'), text: element.textContent?.trim() ?? '', required: Boolean(element.closest('.el-form-item')?.querySelector('.is-required, .el-form-item__label')) })));
        row.Screenshot = path.join(artifactRoot, `${name}.png`);
        await page.screenshot({ path: row.Screenshot, fullPage: false });
        const close = dialog.getByRole('button', { name: /取消|关闭/ }).last();
        if (await close.count()) await close.click({ force: true }).catch(() => undefined);
      }
    }
  } catch (error) {
    row.Error = String(error?.message ?? error).split('\n')[0];
  }
  result.push(row);
}
await browser.close();
await writeFile(path.join(runRoot, 'form-capability-discovery.json'), `${JSON.stringify({ RunId: 'MENU-COVERAGE-EXPANSION-20260827-01', MutationPerformed: false, Records: result }, null, 2)}\n`, 'utf8');
process.stdout.write(JSON.stringify({ MutationPerformed: false, Menus: result.length, Dialogs: result.filter((item) => item.DialogFound).length, NewButtons: result.filter((item) => item.NewButtonFound).length }, null, 2) + '\n');
