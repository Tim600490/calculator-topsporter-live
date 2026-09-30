import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createFreeWealthAccount, projectAccount } from "./freeWealthAccounts.js";

// Exercise the actual pension calculation bodies without mounting React/Recharts.
const source = readFileSync(new URL("./InvestmentCalculator.jsx", import.meta.url), "utf8");
const between = (start, end) => {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `Calculation block found: ${start}`);
  return source.slice(from + start.length, to);
};
const monthlyBody = between("const getMonthlyDepositForMonth2 = (absoluteMonth) => {", "\n  };\n");
const extraBody = between("const getOneTimeExtraForMonth2 = (absoluteMonth) =>", "\n\n  const getMonthlyDepositForMonth3");
const projectionBody = between("const calculationData2 = useMemo(() => {", "\n  }, [");
const contributionBody = between("const pensionPeriodicContributionTotal = useMemo(() => {", "\n  }, [");
const removePhaseBody = between("const removeFreeWealthPhase = (index) => {", "\n        };");
const removeExtraBody = between("const removeFreeWealthExtra = (index) => {", "\n        };");

function calculatePension(account, annualReturn2) {
  const values = { startAmount2: account.startAmount, investmentHorizon2: account.investmentHorizon,
    startDepositsInYear22: account.startDepositsInYear2, annualReturn2, oneTimeExtras2: account.oneTimeExtras };
  for (let phase = 1; phase <= 6; phase++) {
    values[`phase${phase}MonthlyDeposit2`] = account[`phase${phase}MonthlyDeposit`];
    values[phase === 1 ? "phase1Years2" : `phase${phase}EndYear2`] = account[phase === 1 ? "phase1Years" : `phase${phase}EndYear`];
  }
  return new Function(...Object.keys(values), `
    const getMonthlyDepositForMonth2 = (absoluteMonth) => {${monthlyBody}};
    const getOneTimeExtraForMonth2 = (absoluteMonth) => ${extraBody}
    return { rows: (() => {${projectionBody}})(), periodic: (() => {${contributionBody}})() };
  `)(...Object.values(values));
}

for (const [profile, rate] of Object.entries({ Behouden: .044, Gedreven: .057, Ambitieus: .069 })) {
  for (const phaseCount of [3, 6]) {
    for (const delayed of [false, true]) {
      test(`pension ${profile}: ${phaseCount} phases, delayed=${delayed}`, () => {
        const account = { ...createFreeWealthAccount(), profile, startAmount: 50000,
          investmentHorizon: 20, startDepositsInYear2: delayed };
        for (let phase = 1; phase <= phaseCount; phase++) {
          account[`phase${phase}MonthlyDeposit`] = phase * 250;
          account[phase === 1 ? "phase1Years" : `phase${phase}EndYear`] = phase * 29 / 12;
        }
        account.oneTimeExtras = [{ amount: 10000, year: 2, month: 12 }, { amount: 5000, year: 0, month: 0 }];
        const actual = calculatePension(account, rate);
        const expected = projectAccount(account).slice(1);
        assert.deepEqual(actual.rows.map(row => row.balance), expected.map(row => row.balance));
        assert.deepEqual(actual.rows.map(row => row.deposits), expected.map(row => row.deposits));
        assert.equal(actual.periodic, expected.at(-1).deposits - 10000);
      });
    }
  }
}

test("shared phase removal shifts later amounts and preserves their durations", () => {
  const phases = Array.from({ length: 6 }, (_, index) => ({ start: index, end: index + 1, amount: (index + 1) * 100 }));
  const rows = phases.map(phase => ({ ...phase,
    setAmount: value => { phase.amount = value; }, setEnd: value => { phase.end = value; } }));
  let visible = 6;
  let drafts;
  new Function("index", "primaryPhaseRows", "setDurationInputs", "setVisiblePhaseCount", removePhaseBody)(
    1, rows, value => { drafts = value; }, updater => { visible = updater(visible); });
  assert.deepEqual(phases.map(phase => phase.amount), [100, 300, 400, 500, 600, 0]);
  assert.deepEqual(phases.map(phase => phase.end), [1, 2, 3, 4, 5, 5]);
  assert.equal(visible, 5);
  assert.deepEqual(drafts, Array(6).fill(""));
});

test("shared extra removal preserves remaining moments and appends an unset entry", () => {
  let entries = Array.from({ length: 6 }, (_, index) => ({ amount: 1000 * (index + 1), year: index + 1, month: 12 }));
  const original = structuredClone(entries);
  let visible = 6;
  new Function("index", "setPanelExtras", "setVisibleExtraCount", removeExtraBody)(
    1, updater => { entries = updater(entries); }, updater => { visible = updater(visible); });
  assert.deepEqual(entries, [original[0], ...original.slice(2), { amount: 0, year: 0, month: 0 }]);
  assert.equal(visible, 5);
});
