import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const AnchoredBarTooltip = ({ point, label, left, top, formatCurrency }) => {
  if (!point) {
    return null;
  }

  const eigenInleg = (point.initialBalance || 0) + (point.deposits || 0);

  return (
    <div
      style={{
        backgroundColor: "rgba(45, 45, 45, 0.95)",
        color: "#fff",
        borderRadius: "6px",
        padding: "8px 10px",
        fontSize: "12px",
        lineHeight: "1.35",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        position: "absolute",
        left,
        top,
        transform: "translate(-50%, calc(-100% - 3px))",
        zIndex: 5,
        whiteSpace: "nowrap"
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: "4px" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
        <span style={{ width: "8px", height: "8px", background: "#0D2A28" }} />
        <span>Eigen inleg: {formatCurrency(eigenInleg)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ width: "8px", height: "8px", background: "#D2BB5D" }} />
        <span>Rendement: {formatCurrency(point.interest)}</span>
      </div>
    </div>
  );
};

const clampEuro = (value, min = 0, max = 10000) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(parsed)));
};

const normalizeYear = (value, maxYear) => Math.min(maxYear, Math.max(1, Number(value) || 1));
const normalizeMonth = (value) => Math.min(12, Math.max(1, Number(value) || 1));

const InvestmentCalculator = () => {
  const [startAmount, setStartAmount] = useState(25000);
  const [phase1MonthlyDeposit, setPhase1MonthlyDeposit] = useState(7500);
  const [phase1Years, setPhase1Years] = useState(5);
  const [phase2MonthlyDeposit, setPhase2MonthlyDeposit] = useState(3000);
  const [phase2EndYear, setPhase2EndYear] = useState(10);
  const [phase3MonthlyDeposit, setPhase3MonthlyDeposit] = useState(0);
  const [phase3EndYear, setPhase3EndYear] = useState(10);
  const [investmentHorizon, setInvestmentHorizon] = useState(20);
  const [oneTimeExtras, setOneTimeExtras] = useState([
    { amount: 0, year: 5, month: 6 },
    { amount: 0, year: 5, month: 6 },
    { amount: 0, year: 5, month: 6 }
  ]);
  const [startDepositsInYear2, setStartDepositsInYear2] = useState(false);
  const [profile, setProfile] = useState("Gedreven");
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const chartContainerRef = useRef(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

  // Risk profile returns (exact net annual returns)
  const riskProfiles = {
    Behouden: 0.044, // 4.4% jaarlijks netto rendement
    Gedreven: 0.057, // 5.7% jaarlijks netto rendement
    Ambitieus: 0.069 // 6.9% jaarlijks netto rendement
  };

  // Scenario returns
  const worstCaseProfiles = {
    Behouden: 0.024, // 2.4% jaarlijks netto rendement
    Gedreven: 0.032, // 3.2% jaarlijks netto rendement
    Ambitieus: 0.039 // 3.9% jaarlijks netto rendement
  };

  const bestCaseProfiles = {
    Behouden: 0.054, // 5.4% jaarlijks netto rendement
    Gedreven: 0.072, // 7.2% jaarlijks netto rendement
    Ambitieus: 0.084 // 8.4% jaarlijks netto rendement
  };

  const annualReturn = riskProfiles[profile];

  useEffect(() => {
    if (phase1Years > investmentHorizon) {
      setPhase1Years(investmentHorizon);
      return;
    }
    if (phase2EndYear > investmentHorizon) {
      setPhase2EndYear(investmentHorizon);
      return;
    }
    if (phase3EndYear > investmentHorizon) {
      setPhase3EndYear(investmentHorizon);
      return;
    }
    if (phase2EndYear < phase1Years) {
      setPhase2EndYear(phase1Years);
      return;
    }
    if (phase3EndYear < phase2EndYear) {
      setPhase3EndYear(phase2EndYear);
    }
  }, [phase1Years, phase2EndYear, phase3EndYear, investmentHorizon]);

  useEffect(() => {
    setOneTimeExtras((prev) => {
      const next = prev.map((entry) => ({
        amount: clampEuro(entry.amount, 0, 5000000),
        year: normalizeYear(entry.year, investmentHorizon),
        month: normalizeMonth(entry.month)
      }));
      const changed = next.some(
        (entry, idx) =>
          entry.amount !== prev[idx].amount || entry.year !== prev[idx].year || entry.month !== prev[idx].month
      );
      return changed ? next : prev;
    });
  }, [investmentHorizon]);

  const getMonthlyDepositForMonth = (absoluteMonth) => {
    const monthInDepositTimeline = startDepositsInYear2 ? absoluteMonth - 12 : absoluteMonth;
    if (monthInDepositTimeline <= 0) {
      return 0;
    }

    const phase1Months = phase1Years * 12;
    const phase2Months = phase2EndYear * 12;
    const phase3Months = phase3EndYear * 12;

    if (monthInDepositTimeline <= phase1Months) {
      return phase1MonthlyDeposit;
    }
    if (monthInDepositTimeline <= phase2Months) {
      return phase2MonthlyDeposit;
    }
    if (monthInDepositTimeline <= phase3Months) {
      return phase3MonthlyDeposit;
    }
    return 0;
  };

  const getOneTimeExtraForMonth = (absoluteMonth) =>
    oneTimeExtras.reduce((sum, entry) => {
      if (entry.amount <= 0) {
        return sum;
      }
      const targetMonth = (entry.year - 1) * 12 + entry.month;
      return sum + (absoluteMonth === targetMonth ? entry.amount : 0);
    }, 0);

  const updateOneTimeExtra = (index, key, rawValue) => {
    setOneTimeExtras((prev) =>
      prev.map((entry, idx) => {
        if (idx !== index) {
          return entry;
        }
        if (key === "amount") {
          return { ...entry, amount: clampEuro(rawValue, 0, 5000000) };
        }
        if (key === "year") {
          return { ...entry, year: normalizeYear(rawValue, investmentHorizon) };
        }
        return { ...entry, month: normalizeMonth(rawValue) };
      })
    );
  };

  const calculationData = useMemo(() => {
    const data = [];
    let currentBalance = startAmount;
    let totalExtraDeposits = 0;

    const monthlyReturn = annualReturn / 12; // Maandelijks rendement

    for (let year = 1; year <= investmentHorizon; year++) {
      // Start van het jaar
      const yearStartBalance = currentBalance;

      // Voor elke maand in het jaar
      for (let month = 1; month <= 12; month++) {
        const currentMonth = (year - 1) * 12 + month;
        const activeDeposit = getMonthlyDepositForMonth(currentMonth);
        const oneTimeExtra = getOneTimeExtraForMonth(currentMonth);

        // Rendement over huidige saldo
        currentBalance = currentBalance * (1 + monthlyReturn);

        // Maandelijkse storting aan het einde van de maand
        currentBalance += activeDeposit;
        currentBalance += oneTimeExtra;
        totalExtraDeposits += activeDeposit + oneTimeExtra;
      }

      const totalDeposits = startAmount + totalExtraDeposits;
      const accruedInterest = currentBalance - totalDeposits;

      data.push({
        year,
        balance: currentBalance,
        deposits: totalExtraDeposits, // All extra deposits, excluding start amount
        interest: accruedInterest,
        initialBalance: startAmount,
        yearStartBalance
      });
    }

    return data;
  }, [
    startAmount,
    phase1MonthlyDeposit,
    phase1Years,
    phase2MonthlyDeposit,
    phase2EndYear,
    phase3MonthlyDeposit,
    phase3EndYear,
    oneTimeExtras,
    startDepositsInYear2,
    investmentHorizon,
    annualReturn
  ]);

  const finalBalance = calculationData[calculationData.length - 1]?.balance || 0;

  useEffect(() => {
    const updateSize = () => {
      if (!chartContainerRef.current) {
        return;
      }
      setChartSize({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Calculate worst case scenario
  const calculateWorstCase = () => {
    let currentBalance = startAmount;
    const monthlyReturn = worstCaseProfiles[profile] / 12;

    for (let year = 1; year <= investmentHorizon; year++) {
      for (let month = 1; month <= 12; month++) {
        const currentMonth = (year - 1) * 12 + month;
        const activeDeposit = getMonthlyDepositForMonth(currentMonth);
        const oneTimeExtra = getOneTimeExtraForMonth(currentMonth);

        currentBalance = currentBalance * (1 + monthlyReturn);
        currentBalance += activeDeposit;
        currentBalance += oneTimeExtra;
      }
    }
    return currentBalance;
  };

  // Calculate best case scenario
  const calculateBestCase = () => {
    let currentBalance = startAmount;
    const monthlyReturn = bestCaseProfiles[profile] / 12;

    for (let year = 1; year <= investmentHorizon; year++) {
      for (let month = 1; month <= 12; month++) {
        const currentMonth = (year - 1) * 12 + month;
        const activeDeposit = getMonthlyDepositForMonth(currentMonth);
        const oneTimeExtra = getOneTimeExtraForMonth(currentMonth);

        currentBalance = currentBalance * (1 + monthlyReturn);
        currentBalance += activeDeposit;
        currentBalance += oneTimeExtra;
      }
    }
    return currentBalance;
  };

  const worstCaseBalance = calculateWorstCase();
  const bestCaseBalance = calculateBestCase();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrencyShort = (amount) => {
    if (amount >= 1000000) {
      return `€${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `€${(amount / 1000).toFixed(0)}K`;
    }
    return formatCurrency(amount);
  };

  const isDesktop = window.innerWidth >= 1024;
  const hoveredPoint = hoveredIndex != null ? calculationData[hoveredIndex] : null;

  const tooltipAnchor = useMemo(() => {
    if (!hoveredPoint || !chartSize.width || !chartSize.height || calculationData.length === 0) {
      return null;
    }

    const margin = { top: 20, right: 30, left: 20, bottom: 40 };
    const yAxisWidth = 70;
    const plotWidth = chartSize.width - margin.left - margin.right - yAxisWidth;
    const plotHeight = chartSize.height - margin.top - margin.bottom;
    if (plotWidth <= 0 || plotHeight <= 0) {
      return null;
    }

    const step = plotWidth / calculationData.length;
    const left = margin.left + yAxisWidth + step * hoveredIndex + step / 2;
    const maxTotal = Math.max(
      ...calculationData.map((row) => row.initialBalance + row.deposits + Math.max(0, row.interest)),
      1
    );
    const total = hoveredPoint.initialBalance + hoveredPoint.deposits + Math.max(0, hoveredPoint.interest);
    const top = margin.top + (1 - total / maxTotal) * plotHeight;

    return { left, top };
  }, [calculationData, chartSize.height, chartSize.width, hoveredIndex, hoveredPoint]);

  const showcaseGraph = useMemo(() => {
    const halfYearMonths = Array.from({ length: 17 }, (_, i) => i * 6); // 2017.0 -> 2025.0
    const shapeReference = [100, 134, 150, 136, 160, 188, 212, 136, 266, 246, 232, 268, 360, 434, 400, 418, 430];
    const monthlyReturn = annualReturn / 12;

    let balance = startAmount;
    let totalExtraDeposits = 0;
    const stateByMonth = { 0: { balance: startAmount, totalExtraDeposits: 0 } };
    const checkpointSet = new Set(halfYearMonths);

    for (let month = 1; month <= 96; month++) {
      const monthInDepositTimeline = startDepositsInYear2 ? month - 12 : month;
      let monthlyDeposit = 0;
      if (monthInDepositTimeline > 0) {
        const phase1Months = phase1Years * 12;
        const phase2Months = phase2EndYear * 12;
        const phase3Months = phase3EndYear * 12;
        if (monthInDepositTimeline <= phase1Months) {
          monthlyDeposit = phase1MonthlyDeposit;
        } else if (monthInDepositTimeline <= phase2Months) {
          monthlyDeposit = phase2MonthlyDeposit;
        } else if (monthInDepositTimeline <= phase3Months) {
          monthlyDeposit = phase3MonthlyDeposit;
        }
      }

      const oneTimeExtraThisMonth = oneTimeExtras.reduce((sum, entry) => {
        if (entry.amount <= 0) {
          return sum;
        }
        const targetMonth = (entry.year - 1) * 12 + entry.month;
        return sum + (month === targetMonth ? entry.amount : 0);
      }, 0);

      balance = balance * (1 + monthlyReturn);
      balance += monthlyDeposit + oneTimeExtraThisMonth;
      totalExtraDeposits += monthlyDeposit + oneTimeExtraThisMonth;

      if (checkpointSet.has(month)) {
        stateByMonth[month] = { balance, totalExtraDeposits };
      }
    }

    const startRef = shapeReference[0];
    const endRef = shapeReference[shapeReference.length - 1];
    const rangeRef = endRef - startRef || 1;
    const firstBalance = stateByMonth[0].balance;
    const lastBalance = stateByMonth[96]?.balance ?? balance;

    const data = halfYearMonths.map((month, index) => {
      const norm = (shapeReference[index] - startRef) / rangeRef;
      const shapedBalance = firstBalance + norm * (lastBalance - firstBalance);
      const year = 2017 + month / 12;
      return { yearValue: year, balance: shapedBalance };
    });

    const finalBalanceShowcase = data[data.length - 1]?.balance ?? lastBalance;
    const ownContribution = startAmount + (stateByMonth[96]?.totalExtraDeposits ?? totalExtraDeposits);
    const totalReturn = finalBalanceShowcase - ownContribution;
    const avgMonthlyContribution = (stateByMonth[96]?.totalExtraDeposits ?? totalExtraDeposits) / 96;

    return {
      data,
      finalBalanceShowcase,
      totalReturn,
      ownContribution,
      avgMonthlyContribution
    };
  }, [
    annualReturn,
    oneTimeExtras,
    phase1MonthlyDeposit,
    phase1Years,
    phase2MonthlyDeposit,
    phase2EndYear,
    phase3MonthlyDeposit,
    phase3EndYear,
    startAmount,
    startDepositsInYear2
  ]);

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "24px",
        backgroundColor: "#F7F5E9",
        minHeight: "100vh",
        fontFamily:
          'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Main Content - Desktop: Side by Side */}
      <div
        style={{
          display: "flex",
          gap: "32px",
          flexDirection: isDesktop ? "row" : "column",
          alignItems: "flex-start",
          marginTop: isDesktop ? "120px" : "0"
        }}
      >
        {/* Left Panel - Input Controls (40% on desktop) */}
        <div
          style={{
            width: isDesktop ? "40%" : "100%",
            backgroundColor: "#F7F5E9",
            borderRadius: "8px",
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: isDesktop ? "0" : "32px"
          }}
        >
          {/* Start Amount */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}
            >
              <label style={{ fontSize: "18px", fontWeight: "500", color: "#111827" }}>
                Startbedrag
              </label>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                {formatCurrency(startAmount)}
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="range"
                min="0"
                max="1000000"
                step="1000"
                value={startAmount}
                onChange={(e) => setStartAmount(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #D2BB5D 0%, #D2BB5D ${(startAmount / 1000000) * 100}%, #E5E7EB ${(startAmount / 1000000) * 100}%, #E5E7EB 100%)`,
                  outline: "none",
                  appearance: "none",
                  cursor: "pointer"
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  color: "#6B7280",
                  marginTop: "8px"
                }}
              >
                <span>€0</span>
                <span>€1.000.000</span>
              </div>
            </div>
          </div>

          {/* Monthly Deposit - Phase 1 */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}
            >
              <label style={{ fontSize: "18px", fontWeight: "500", color: "#111827" }}>
                Inleg p/m fase 1
              </label>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                {formatCurrency(phase1MonthlyDeposit)}
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={phase1MonthlyDeposit}
                onChange={(e) => setPhase1MonthlyDeposit(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #D2BB5D 0%, #D2BB5D ${(phase1MonthlyDeposit / 10000) * 100}%, #E5E7EB ${(phase1MonthlyDeposit / 10000) * 100}%, #E5E7EB 100%)`,
                  outline: "none",
                  appearance: "none",
                  cursor: "pointer"
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  color: "#6B7280",
                  marginTop: "8px"
                }}
              >
                <span>€0</span>
                <span>€10.000</span>
              </div>
              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px", color: "#6B7280" }}>Exact p/m:</span>
                <span style={{ fontSize: "14px", color: "#111827" }}>€</span>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="1"
                  value={phase1MonthlyDeposit}
                  onChange={(e) => setPhase1MonthlyDeposit(clampEuro(e.target.value))}
                  style={{
                    width: "120px",
                    padding: "6px 8px",
                    border: "1px solid #D2BB5D",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                    backgroundColor: "#fff"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Phase 1 End Year */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}
            >
              <label style={{ fontSize: "18px", fontWeight: "500", color: "#111827" }}>
                Fase 1 tot jaar
              </label>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                {phase1Years} jaar
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="range"
                min="0"
                max={investmentHorizon}
                step="1"
                value={phase1Years}
                onChange={(e) => setPhase1Years(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #D2BB5D 0%, #D2BB5D ${investmentHorizon === 0 ? 0 : (phase1Years / investmentHorizon) * 100}%, #E5E7EB ${investmentHorizon === 0 ? 0 : (phase1Years / investmentHorizon) * 100}%, #E5E7EB 100%)`,
                  outline: "none",
                  appearance: "none",
                  cursor: "pointer"
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  color: "#6B7280",
                  marginTop: "8px"
                }}
              >
                <span>0 jaar</span>
                <span>{investmentHorizon} jaar</span>
              </div>
            </div>
          </div>

          {/* Monthly Deposit - Phase 2 */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}
            >
              <label style={{ fontSize: "18px", fontWeight: "500", color: "#111827" }}>
                Inleg p/m fase 2
              </label>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                {formatCurrency(phase2MonthlyDeposit)}
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={phase2MonthlyDeposit}
                onChange={(e) => setPhase2MonthlyDeposit(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #D2BB5D 0%, #D2BB5D ${(phase2MonthlyDeposit / 10000) * 100}%, #E5E7EB ${(phase2MonthlyDeposit / 10000) * 100}%, #E5E7EB 100%)`,
                  outline: "none",
                  appearance: "none",
                  cursor: "pointer"
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  color: "#6B7280",
                  marginTop: "8px"
                }}
              >
                <span>€0</span>
                <span>€10.000</span>
              </div>
              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px", color: "#6B7280" }}>Exact p/m:</span>
                <span style={{ fontSize: "14px", color: "#111827" }}>€</span>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="1"
                  value={phase2MonthlyDeposit}
                  onChange={(e) => setPhase2MonthlyDeposit(clampEuro(e.target.value))}
                  style={{
                    width: "120px",
                    padding: "6px 8px",
                    border: "1px solid #D2BB5D",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                    backgroundColor: "#fff"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Phase 2 End Year */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}
            >
              <label style={{ fontSize: "18px", fontWeight: "500", color: "#111827" }}>
                Fase 2 tot jaar
              </label>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                {phase2EndYear} jaar
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="range"
                min={phase1Years}
                max={investmentHorizon}
                step="1"
                value={phase2EndYear}
                onChange={(e) => setPhase2EndYear(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #D2BB5D 0%, #D2BB5D ${
                    investmentHorizon - phase1Years === 0
                      ? 0
                      : ((phase2EndYear - phase1Years) / (investmentHorizon - phase1Years)) * 100
                  }%, #E5E7EB ${
                    investmentHorizon - phase1Years === 0
                      ? 0
                      : ((phase2EndYear - phase1Years) / (investmentHorizon - phase1Years)) * 100
                  }%, #E5E7EB 100%)`,
                  outline: "none",
                  appearance: "none",
                  cursor: "pointer"
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  color: "#6B7280",
                  marginTop: "8px"
                }}
              >
                <span>{phase1Years} jaar</span>
                <span>{investmentHorizon} jaar</span>
              </div>
            </div>
          </div>

          {/* Monthly Deposit - Phase 3 */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}
            >
              <label style={{ fontSize: "18px", fontWeight: "500", color: "#111827" }}>
                Inleg p/m fase 3
              </label>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                {formatCurrency(phase3MonthlyDeposit)}
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={phase3MonthlyDeposit}
                onChange={(e) => setPhase3MonthlyDeposit(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #D2BB5D 0%, #D2BB5D ${(phase3MonthlyDeposit / 10000) * 100}%, #E5E7EB ${(phase3MonthlyDeposit / 10000) * 100}%, #E5E7EB 100%)`,
                  outline: "none",
                  appearance: "none",
                  cursor: "pointer"
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  color: "#6B7280",
                  marginTop: "8px"
                }}
              >
                <span>€0</span>
                <span>€10.000</span>
              </div>
              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px", color: "#6B7280" }}>Exact p/m:</span>
                <span style={{ fontSize: "14px", color: "#111827" }}>€</span>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="1"
                  value={phase3MonthlyDeposit}
                  onChange={(e) => setPhase3MonthlyDeposit(clampEuro(e.target.value))}
                  style={{
                    width: "120px",
                    padding: "6px 8px",
                    border: "1px solid #D2BB5D",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                    backgroundColor: "#fff"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Phase 3 End Year */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}
            >
              <label style={{ fontSize: "18px", fontWeight: "500", color: "#111827" }}>
                Fase 3 tot jaar
              </label>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                {phase3EndYear} jaar
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="range"
                min={phase2EndYear}
                max={investmentHorizon}
                step="1"
                value={phase3EndYear}
                onChange={(e) => setPhase3EndYear(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #D2BB5D 0%, #D2BB5D ${
                    investmentHorizon - phase2EndYear === 0
                      ? 0
                      : ((phase3EndYear - phase2EndYear) / (investmentHorizon - phase2EndYear)) * 100
                  }%, #E5E7EB ${
                    investmentHorizon - phase2EndYear === 0
                      ? 0
                      : ((phase3EndYear - phase2EndYear) / (investmentHorizon - phase2EndYear)) * 100
                  }%, #E5E7EB 100%)`,
                  outline: "none",
                  appearance: "none",
                  cursor: "pointer"
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  color: "#6B7280",
                  marginTop: "8px"
                }}
              >
                <span>{phase2EndYear} jaar</span>
                <span>{investmentHorizon} jaar</span>
              </div>
            </div>
          </div>

          {/* Investment Horizon */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}
            >
              <label style={{ fontSize: "18px", fontWeight: "500", color: "#111827" }}>
                Beleggingshorizon
              </label>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                {investmentHorizon} jaar
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={investmentHorizon}
                onChange={(e) => setInvestmentHorizon(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #D2BB5D 0%, #D2BB5D ${((investmentHorizon - 1) / 49) * 100}%, #E5E7EB ${((investmentHorizon - 1) / 49) * 100}%, #E5E7EB 100%)`,
                  outline: "none",
                  appearance: "none",
                  cursor: "pointer"
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  color: "#6B7280",
                  marginTop: "8px"
                }}
              >
                <span>1 jaar</span>
                <span>50 jaar</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "16px",
                fontWeight: "500",
                color: "#111827",
                cursor: "pointer"
              }}
            >
              <input
                type="checkbox"
                checked={startDepositsInYear2}
                onChange={(e) => setStartDepositsInYear2(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#D2BB5D", cursor: "pointer" }}
              />
              Start maandinleg vanaf jaar 2 (jaar 1 zonder inleg)
            </label>
          </div>

          {/* One-time extra deposit */}
          <div style={{ marginBottom: "28px", padding: "12px", border: "1px solid #D2BB5D", borderRadius: "8px" }}>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#111827", marginBottom: "12px" }}>
              Eenmalige extra inleg
            </div>
            {oneTimeExtras.map((entry, index) => (
              <div key={`extra-${index}`} style={{ marginBottom: index === oneTimeExtras.length - 1 ? 0 : "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "14px", color: "#6B7280", minWidth: "74px" }}>Bedrag {index + 1}</span>
                  <span style={{ fontSize: "14px", color: "#111827" }}>€</span>
                  <input
                    type="number"
                    min="0"
                    max="5000000"
                    step="1"
                    value={entry.amount}
                    onChange={(e) => updateOneTimeExtra(index, "amount", e.target.value)}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      border: "1px solid #D2BB5D",
                      borderRadius: "6px",
                      fontSize: "14px",
                      outline: "none",
                      backgroundColor: "#fff",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", columnGap: "16px" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "14px", color: "#6B7280", marginBottom: "6px" }}>
                      Bedrag {index + 1} - Jaar
                    </div>
                    <input
                      type="number"
                      min="1"
                      max={investmentHorizon}
                      step="1"
                      value={entry.year}
                      onChange={(e) => updateOneTimeExtra(index, "year", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        border: "1px solid #D2BB5D",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none",
                        backgroundColor: "#fff",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "14px", color: "#6B7280", marginBottom: "6px" }}>
                      Bedrag {index + 1} - Maand
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      step="1"
                      value={entry.month}
                      onChange={(e) => updateOneTimeExtra(index, "month", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        border: "1px solid #D2BB5D",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none",
                        backgroundColor: "#fff",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Profile */}
          <div style={{ marginBottom: "32px" }}>
            <label
              style={{
                fontSize: "18px",
                fontWeight: "500",
                color: "#111827",
                display: "block",
                marginBottom: "16px",
                textAlign: "center"
              }}
            >
              Portefeuille
            </label>
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1.4px solid #D2BB5D",
                borderRadius: "8px",
                fontSize: "18px",
                outline: "none",
                backgroundColor: "#E5E7EB",
                textAlign: "center",
                textAlignLast: "center"
              }}
            >
              <option value="Behouden">Behouden</option>
              <option value="Gedreven">Gedreven</option>
              <option value="Ambitieus">Ambitieus</option>
            </select>
          </div>
        </div>

        {/* Right Panel - Results (60% on desktop) */}
        <div
          style={{
            width: isDesktop ? "60%" : "100%",
            position: "relative"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              position: isDesktop ? "absolute" : "relative",
              left: isDesktop ? "50%" : "auto",
              transform: isDesktop ? "translateX(-50%)" : "none",
              top: isDesktop ? "-120px" : "0",
              marginBottom: isDesktop ? "0" : "16px",
              zIndex: 2,
              width: isDesktop ? "100%" : "auto",
              pointerEvents: "none"
            }}
          >
            <div
              style={{
                backgroundColor: "#032c2c",
                border: "2px solid #cfb455",
                borderRadius: "14px",
                textAlign: "center",
                padding: "14px 20px 16px",
                minWidth: "246px"
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  color: "#e7efea",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.35px"
                }}
              >
                Verwacht eindresultaat*
              </div>
              <div
                style={{
                  fontSize: "41px",
                  fontWeight: 700,
                  color: "#eff6f1",
                  lineHeight: 1
                }}
              >
                {formatCurrency(finalBalance)}
                <span style={{ fontSize: "20px", verticalAlign: "top" }}>*</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div
            style={{
              backgroundColor: "#F7F5E9",
              borderRadius: "8px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              height: "100%"
            }}
          >
            <div style={{ height: "450px", position: "relative" }} ref={chartContainerRef}>
              <div
                style={{
                  position: "absolute",
                  inset: "24px 28px 78px 72px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  zIndex: 0
                }}
              >
                <svg
                  viewBox="0 0 400 400"
                  aria-hidden="true"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ width: "82%", height: "82%", maxWidth: "360px", opacity: 0.09 }}
                >
                  <path
                    d="M194 18c106 0 192 86 192 192v172H194C88 382 2 296 2 190S88 18 194 18z"
                    fill="#0D2A28"
                  />
                  <circle cx="190" cy="210" r="78" fill="none" stroke="#F7F5E9" strokeWidth="42" />
                  <line x1="270" y1="210" x2="270" y2="306" stroke="#F7F5E9" strokeWidth="42" strokeLinecap="round" />
                </svg>
              </div>
              {hoveredPoint && tooltipAnchor ? (
                <AnchoredBarTooltip
                  point={hoveredPoint}
                  label={hoveredPoint.year}
                  left={tooltipAnchor.left}
                  top={tooltipAnchor.top}
                  formatCurrency={formatCurrency}
                />
              ) : null}
              <div style={{ position: "relative", zIndex: 1, height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={calculationData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <defs>
                      <linearGradient id="whiteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
                        <stop offset="50%" stopColor="#fafafa" stopOpacity={1} />
                        <stop offset="100%" stopColor="#f5f5f5" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="darkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0D2A28" stopOpacity={1} />
                        <stop offset="50%" stopColor="#1a3b37" stopOpacity={1} />
                        <stop offset="100%" stopColor="#0D2A28" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#D2BB5D" stopOpacity={1} />
                        <stop offset="50%" stopColor="#e0cc73" stopOpacity={1} />
                        <stop offset="100%" stopColor="#D2BB5D" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: investmentHorizon >= 26 ? 10 : 12, fill: "#6B7280" }}
                      label={{
                        value: "Jaren",
                        position: "insideBottom",
                        offset: -10,
                        style: { textAnchor: "middle", fill: "#6B7280" }
                      }}
                      interval={0}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      tickFormatter={formatCurrencyShort}
                      width={70}
                    />
                    <Bar
                      dataKey="initialBalance"
                      stackId="stack"
                      fill="url(#whiteGradient)"
                      stroke="#D1D5DB"
                      strokeWidth={1}
                      radius={[0, 0, 4, 4]}
                      onMouseOver={(_, index) => setHoveredIndex(index)}
                    />
                    <Bar
                      dataKey="deposits"
                      stackId="stack"
                      fill="url(#darkGradient)"
                      radius={[0, 0, 0, 0]}
                      onMouseOver={(_, index) => setHoveredIndex(index)}
                    />
                    <Bar
                      dataKey="interest"
                      stackId="stack"
                      fill="url(#goldGradient)"
                      radius={[4, 4, 0, 0]}
                      onMouseOver={(_, index) => setHoveredIndex(index)}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginTop: "16px", fontSize: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                    border: "1px solid #D1D5DB"
                  }}
                ></div>
                <span>Startbedrag</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#0D2A28"
                  }}
                ></div>
                <span>Periodieke inleg</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "#D2BB5D"
                  }}
                ></div>
                <span>Rendement</span>
              </div>
            </div>

            {/* Disclaimer */}
            <div
              style={{
                marginTop: "12px",
                fontSize: "11px",
                color: "#9CA3AF",
                lineHeight: "1.4"
              }}
            >
              *Dit is het gemiddelde resultaat. Ook mindere en betere scenario&apos;s zijn mogelijk waarbij het
              resultaat waarschijnlijk tussen {formatCurrency(worstCaseBalance)} en{" "}
              {formatCurrency(bestCaseBalance)} zal liggen. Voor details en achtergronden zie onze FAQ
              <br />
              **Deze rekentool laat de te verwachten netto € resultaten zien, dus na aftrek van de kosten.
            </div>
          </div>
        </div>
      </div>

      <section
        style={{
          marginTop: "28px",
          background: "#0d2a28",
          color: "#eaf2ef",
          borderRadius: "8px",
          border: "1px solid rgba(210,187,93,0.35)",
          padding: "22px"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "20px",
            flexDirection: isDesktop ? "row" : "column"
          }}
        >
          <div style={{ maxWidth: "660px" }}>
            <h3 style={{ margin: 0, fontSize: "38px", lineHeight: "1.1" }}>
              De cijfers <em>spreken</em>
            </h3>
            <p style={{ marginTop: "8px", marginBottom: 0, fontSize: "17px", lineHeight: "1.5", color: "#d2ddd8" }}>
              Deze grafiek laat zien hoe je portefeuille zou zijn gegroeid wanneer je de afgelopen jaren belegd zou
              hebben zoals Animo dat nu mogelijk maakt. De gegevens zijn gebaseerd op historische netto resultaten van
              vergelijkbare portefeuilles van onze beheerder, HIP Capital.
            </p>
          </div>
          <div style={{ minWidth: "220px", paddingTop: "6px", paddingLeft: "14px" }}>
            <div
              style={{
                border: "1px solid #cfb455",
                borderRadius: "2px",
                padding: "14px 12px",
                textAlign: "center",
                marginBottom: "24px"
              }}
            >
              <div style={{ fontSize: "12px", color: "#c8d5cf", marginBottom: "6px" }}>Vermogen op 01-01-2025</div>
              <div style={{ fontSize: "38px", fontWeight: 700, color: "#e3c75a" }}>
                {formatCurrency(showcaseGraph.finalBalanceShowcase)}
              </div>
            </div>
            <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "14px", textAlign: "right" }}>
              Totaal rendement: {formatCurrency(showcaseGraph.totalReturn)}
            </div>
            <div style={{ fontSize: "15px", fontWeight: 600, textAlign: "right" }}>
              Totaal eigen inleg: {formatCurrency(showcaseGraph.ownContribution)}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "20px", height: "320px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={showcaseGraph.data} margin={{ top: 16, right: 10, left: 10, bottom: 8 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.12)" />
              <XAxis
                type="number"
                dataKey="yearValue"
                domain={[2017, 2025]}
                ticks={[2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]}
                axisLine={{ stroke: "rgba(255,255,255,0.22)" }}
                tickLine={false}
                tick={{ fill: "#d2ddd8", fontSize: 12 }}
                tickFormatter={(value) => `${value}`}
                allowDecimals={false}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#d2ddd8", fontSize: 12 }}
                tickFormatter={(value) => Math.round(value).toLocaleString("nl-NL")}
              />
              <Line type="monotone" dataKey="balance" stroke="#d9bf56" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #D2BB5D;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        input[type="range"]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #D2BB5D;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          border: none;
        }
      `}</style>
    </div>
  );
};

export default InvestmentCalculator;
