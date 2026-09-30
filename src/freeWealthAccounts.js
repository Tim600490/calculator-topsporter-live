export const ACCOUNT_COLORS = ["#d2bb5d", "#328c87"];
const RETURNS = { Behouden: 0.044, Gedreven: 0.057, Ambitieus: 0.069 };
const LOW_RETURNS = { Behouden: 0.024, Gedreven: 0.032, Ambitieus: 0.039 };
const HIGH_RETURNS = { Behouden: 0.054, Gedreven: 0.072, Ambitieus: 0.084 };
export const phaseEndKey = (index) => index === 0 ? "phase1Years" : `phase${index + 1}EndYear`;

export function createFreeWealthAccount(index = 0) {
  const account = {
    id: `free-${index + 1}`, name: `Rekening ${index + 1}`,
    startAmount: 0, startAge: 18, investmentHorizon: 20, profile: "Gedreven",
    startDepositsInYear2: false,
    oneTimeExtras: Array.from({ length: 6 }, () => ({ amount: 0, year: 0, month: 0 })),
    freeWealthPayouts: Array.from({ length: 3 }, () => ({ amount: 0, fromAge: 35, toAge: 36 })),
    freeWealthSwitchToConservative: false, freeWealthConservativeFromYear: 1,
    visibleFreeWealthPhaseCount: 1, visibleFreeWealthExtraCount: 1,
    freeWealthDurationInputs: Array(6).fill(""),
    isCalculatorExpanded: false, isOneTimeExtrasExpanded: false
  };
  for (let i = 0; i < 6; i++) {
    account[phaseEndKey(i)] = 0;
    account[`phase${i + 1}MonthlyDeposit`] = 0;
  }
  return account;
}

export function monthlyDeposit(account, month) {
  const depositMonth = account.startDepositsInYear2 ? month - 12 : month;
  if (depositMonth <= 0) return 0;
  for (let i = 0; i < 6; i++) {
    if (depositMonth <= account[phaseEndKey(i)] * 12) {
      return account[`phase${i + 1}MonthlyDeposit`];
    }
  }
  return 0;
}

export function extraDeposit(account, month) {
  return account.oneTimeExtras.reduce((sum, row) =>
    sum + (row.amount > 0 && row.year > 0 && row.month > 0 &&
      (row.year - 1) * 12 + row.month === month ? row.amount : 0), 0);
}

// Same timing as the original calculator: monthly return, then end-of-month deposits.
// Beyond the deposit horizon, capital continues to grow for a common-age comparison.
export function projectAccount(account, endAge = account.startAge + account.investmentHorizon, scenario = "expected") {
  const rate = (scenario === "low" ? LOW_RETURNS : scenario === "high" ? HIGH_RETURNS : RETURNS)[account.profile];
  let balance = account.startAmount;
  let deposits = 0;
  const rows = [{ age: account.startAge, year: 0, balance, deposits, initialBalance: account.startAmount, interest: 0 }];
  for (let age = account.startAge + 1; age <= endAge; age++) {
    const year = age - account.startAge;
    const yearStartBalance = balance;
    for (let month = 1; month <= 12; month++) {
      const absoluteMonth = (year - 1) * 12 + month;
      const withinHorizon = absoluteMonth <= account.investmentHorizon * 12;
      const monthly = withinHorizon ? monthlyDeposit(account, absoluteMonth) : 0;
      const extra = withinHorizon ? extraDeposit(account, absoluteMonth) : 0;
      balance *= 1 + rate / 12;
      balance += monthly;
      balance += extra;
      deposits += monthly + extra;
    }
    rows.push({ age, year, balance, deposits, initialBalance: account.startAmount,
      interest: balance - account.startAmount - deposits, yearStartBalance });
  }
  return rows;
}

export function combinedProjection(accounts) {
  const startAge = Math.min(...accounts.map((account) => account.startAge));
  const endAge = Math.max(...accounts.map((account) => account.startAge + account.investmentHorizon));
  const projections = accounts.map((account) => projectAccount(account, endAge));
  const rows = Array.from({ length: endAge - startAge + 1 }, (_, offset) => {
    const age = startAge + offset;
    const row = { age, balance: 0, initialBalance: 0, deposits: 0, interest: 0 };
    projections.forEach((projection, index) => {
      const point = projection.find((entry) => entry.age === age);
      row[`account${index + 1}`] = point?.balance ?? 0;
      for (const key of ["balance", "initialBalance", "deposits", "interest"]) row[key] += point?.[key] ?? 0;
    });
    return row;
  });
  return { startAge, endAge, rows, finalBalance: rows.at(-1).balance,
    low: accounts.reduce((sum, account) => sum + projectAccount(account, endAge, "low").at(-1).balance, 0),
    high: accounts.reduce((sum, account) => sum + projectAccount(account, endAge, "high").at(-1).balance, 0) };
}

export function accountVisibleEndAge(account) {
  return account.freeWealthPayouts.reduce((end, row) => row.amount > 0 ? Math.max(end, row.toAge) : end,
    account.startAge + account.investmentHorizon);
}

// Same timing as the original lifeline: withdrawals at start of age-year,
// then twelve months of growth and contributions. Accounts never fund each other's withdrawals.
export function accountLifeline(account, maxAge) {
  let balance = account.startAmount;
  const rows = [];
  for (let age = account.startAge; age <= maxAge; age++) {
    const planned = account.freeWealthPayouts.reduce((sum, row) =>
      sum + (age >= row.fromAge && age <= row.toAge ? row.amount : 0), 0);
    const income = Math.min(planned, balance);
    balance = Math.max(0, balance - income);
    rows.push({ age, balance, income });
    for (let month = 1; month <= 12; month++) {
      const absoluteMonth = (age - account.startAge) * 12 + month;
      const conservative = account.freeWealthSwitchToConservative &&
        Math.ceil(absoluteMonth / 12) >= account.freeWealthConservativeFromYear;
      const rate = conservative ? RETURNS.Behouden : RETURNS[account.profile];
      balance *= 1 + rate / 12;
      if (absoluteMonth <= account.investmentHorizon * 12) {
        balance += monthlyDeposit(account, absoluteMonth) + extraDeposit(account, absoluteMonth);
      }
    }
  }
  return rows;
}
