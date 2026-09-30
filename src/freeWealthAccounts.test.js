import test from "node:test";
import assert from "node:assert/strict";
import { createFreeWealthAccount, projectAccount, combinedProjection, accountLifeline, monthlyDeposit } from "./freeWealthAccounts.js";

// Independent reference for the pre-existing calculator: six cumulative phase
// boundaries, return before monthly deposits, and extras at month end.
function originalProjection(account, annualReturn) {
  const ends = [account.phase1Years, ...[2, 3, 4, 5, 6].map(n => account[`phase${n}EndYear`])];
  let balance = account.startAmount;
  let deposits = 0;
  const rows = [];
  for (let year = 1; year <= account.investmentHorizon; year++) {
    for (let month = 1; month <= 12; month++) {
      const absolute = (year - 1) * 12 + month;
      const relative = account.startDepositsInYear2 ? absolute - 12 : absolute;
      const phase = relative > 0 ? ends.findIndex(end => relative <= end * 12) : -1;
      const monthly = phase < 0 ? 0 : account[`phase${phase + 1}MonthlyDeposit`];
      const extra = account.oneTimeExtras.reduce((sum, row) => sum +
        (row.amount > 0 && absolute === (row.year - 1) * 12 + row.month ? row.amount : 0), 0);
      balance *= 1 + annualReturn / 12;
      balance += monthly;
      balance += extra;
      deposits += monthly + extra;
    }
    rows.push({ balance, deposits });
  }
  return rows;
}

for (const [profile, rates] of Object.entries({ Behouden: [.044, .024, .054], Gedreven: [.057, .032, .072], Ambitieus: [.069, .039, .084] })) {
  for (const delayed of [false, true]) {
    test(`unchanged original formulas: ${profile}, delayed=${delayed}`, () => {
      const account = { ...createFreeWealthAccount(), profile, startAmount: 150000,
        investmentHorizon: 20, startDepositsInYear2: delayed,
        phase1Years: 29 / 12, phase1MonthlyDeposit: 6000,
        phase2EndYear: 3, phase2MonthlyDeposit: 4000,
        phase3EndYear: 5.5, phase3MonthlyDeposit: 1000,
        phase4EndYear: 7, phase4MonthlyDeposit: 0,
        phase5EndYear: 8, phase5MonthlyDeposit: 750,
        phase6EndYear: 12, phase6MonthlyDeposit: 500,
        oneTimeExtras: [{ amount: 2000, year: 0, month: 0 }, { amount: 10000, year: 1, month: 1 },
          { amount: 40000, year: 5, month: 6 }, { amount: 3000, year: 20, month: 12 },
          { amount: 1000, year: 5, month: 6 }, { amount: 50000, year: 21, month: 1 }] };
      ["expected", "low", "high"].forEach((scenario, index) => {
        assert.deepEqual(projectAccount(account, undefined, scenario).slice(1).map(({ balance, deposits }) => ({ balance, deposits })),
          originalProjection(account, rates[index]));
      });
      const timeline = accountLifeline(account, account.startAge + account.investmentHorizon);
      projectAccount(account).forEach((row, i) => assert.ok(Math.abs(row.balance - timeline[i].balance) < 1e-7));
    });
  }
}

test("same-age totals, different start ages and horizons, no early capital", () => {
  const first = { ...createFreeWealthAccount(), startAge: 27, startAmount: 50000, investmentHorizon: 2, profile: "Ambitieus" };
  const second = { ...createFreeWealthAccount(1), startAge: 30, startAmount: 25000, investmentHorizon: 3 };
  const combined = combinedProjection([first, second]);
  assert.equal(combined.startAge, 27);
  assert.equal(combined.endAge, 33);
  assert.equal(combined.rows.find(row => row.age === 29).account2, 0);
  assert.equal(combined.rows.find(row => row.age === 30).account2, 25000);
  assert.equal(combined.finalBalance, projectAccount(first, 33).at(-1).balance + projectAccount(second).at(-1).balance);
  combined.rows.forEach(row => assert.equal(row.balance, row.account1 + row.account2));
});

test("withdrawals never use another account's balance; conservative switch is per account", () => {
  const first = { ...createFreeWealthAccount(), startAmount: 1000, startAge: 30,
    freeWealthPayouts: [{ amount: 5000, fromAge: 30, toAge: 31 }] };
  const second = { ...createFreeWealthAccount(1), startAmount: 10000, startAge: 30, profile: "Ambitieus" };
  const firstRows = accountLifeline(first, 32);
  assert.deepEqual(firstRows[0], { age: 30, balance: 0, income: 1000 });
  assert.equal(firstRows[1].income, 0);
  const normal = accountLifeline(second, 32);
  const conservative = accountLifeline({ ...second, freeWealthSwitchToConservative: true, freeWealthConservativeFromYear: 2 }, 32);
  assert.equal(normal[0].income, 0);
  assert.equal(normal[1].balance, conservative[1].balance);
  assert.ok(normal[2].balance > conservative[2].balance);
  assert.equal(second.freeWealthSwitchToConservative, false);
});

test("phase month notation, delayed deposits and horizon cut-off", () => {
  const account = { ...createFreeWealthAccount(), phase1Years: 29 / 12, phase1MonthlyDeposit: 100,
    phase2EndYear: 3, phase2MonthlyDeposit: 200, investmentHorizon: 1 };
  assert.equal(monthlyDeposit(account, 29), 100);
  assert.equal(monthlyDeposit(account, 30), 200);
  assert.equal(monthlyDeposit({ ...account, startDepositsInYear2: true }, 12), 0);
  assert.equal(monthlyDeposit({ ...account, startDepositsInYear2: true }, 13), 100);
  assert.equal(projectAccount(account, 22).at(-1).deposits, 1200);
});

test("account defaults have independent phases, payout rows and unset extra moments", () => {
  const first = createFreeWealthAccount();
  const second = createFreeWealthAccount(1);
  first.oneTimeExtras[0].amount = 50000;
  first.freeWealthPayouts[0].amount = 10000;
  assert.equal(second.oneTimeExtras[0].amount, 0);
  assert.equal(second.freeWealthPayouts[0].amount, 0);
  assert.equal(projectAccount(first).at(-1).balance, 0);
  assert.notEqual(first.id, second.id);
});
