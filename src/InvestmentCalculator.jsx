import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

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

const AnchoredIncomeTooltip = ({ point, label, left, top, formatCurrency }) => {
  if (!point) {
    return null;
  }

  const rows = [
    { key: "vrij", color: "#d2bb5d", label: "Vrij Vermogen Animo", value: point.vrij || 0, bruto: false, netto: true },
    { key: "cfk", color: "#0d2a28", label: "CFK", value: point.cfk || 0, bruto: true },
    { key: "pensioen", color: "#6672a8", label: "Pensioen Animo", value: point.pensioen || 0, bruto: true },
    { key: "aow", color: "#c0c0c0", label: "AOW", value: point.aow || 0, bruto: true },
    { key: "nextgen", color: "#ffa07a", label: "Next Generation Animo", value: point.nextgen || 0, netto: true }
  ].filter((row) => row.value > 0);

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
      {rows.length === 0 ? (
        <div style={{ color: "rgba(255,255,255,0.8)" }}>Geen uitkering</div>
      ) : (
        rows.map((row) => (
          <div key={row.key} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
            <span style={{ width: "8px", height: "8px", background: row.color }} />
            <span>
              {row.label}
              {row.bruto ? <span style={{ fontSize: "10px", opacity: 0.85 }}> bruto</span> : ""}
              {row.netto ? <span style={{ fontSize: "10px", opacity: 0.85 }}> netto</span> : ""}: {formatCurrency(row.value)}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

const AnchoredPotTooltip = ({ point, label, left, top, formatCurrency }) => {
  if (!point) {
    return null;
  }

  const rows = [
    { key: "vrij", color: "#d2bb5d", label: "Vrij Vermogen Animo", value: point.vrij || 0, bruto: false, netto: true },
    { key: "cfk", color: "#0d2a28", label: "CFK", value: point.cfk || 0, bruto: true },
    { key: "pensioen", color: "#6672a8", label: "Pensioen Animo", value: point.pensioen || 0, bruto: true }
  ].filter((row) => row.value > 0);

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
      {rows.length === 0 ? (
        <div style={{ color: "rgba(255,255,255,0.8)" }}>Geen vermogen</div>
      ) : (
        rows.map((row) => (
          <div key={row.key} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
            <span style={{ width: "8px", height: "8px", background: row.color }} />
            <span>
              {row.label}
              {row.bruto ? <span style={{ fontSize: "10px", opacity: 0.85 }}> bruto</span> : ""}
              {row.netto ? <span style={{ fontSize: "10px", opacity: 0.85 }}> netto</span> : ""}: {formatCurrency(row.value)}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

const LifelineHoverTooltip = ({ active, payload, label, formatCurrency, zoomMode, activeSeriesKey, focusedSeriesKey }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const rawPoint = payload[0]?.payload || {};
  const seriesConfig = {
    vva: { color: "#d2bb5d", label: "Vrij Vermogen Animo", lowKey: "vvaLow", highKey: "vvaHigh", netto: true },
    cfk: { color: "#0d2a28", label: "CFK", bruto: true },
    pensioen: { color: "#6672a8", label: "Pensioen Animo", lowKey: "pensioenLow", highKey: "pensioenHigh", bruto: true },
    nextgen: { color: "#ffa07a", label: "Next Generation Animo", netto: true }
  };
  const availableSeriesKeys = ["vva", "cfk", "pensioen", "nextgen"].filter((key) => (rawPoint[key] || 0) > 0);
  const selectedSeriesKey = availableSeriesKeys.includes(activeSeriesKey) ? activeSeriesKey : null;
  if (!selectedSeriesKey) {
    return null;
  }

  const series = seriesConfig[selectedSeriesKey];
  const expectedValue = rawPoint[selectedSeriesKey] || 0;
  const betterValue = series.highKey ? rawPoint[series.highKey] || expectedValue : expectedValue;
  const lowerValue = series.lowKey ? rawPoint[series.lowKey] || expectedValue : expectedValue;
  const showScenarioDetails =
    zoomMode === "full" &&
    focusedSeriesKey === selectedSeriesKey &&
    Boolean(series.lowKey) &&
    Boolean(series.highKey);

  const weekLabels = {
    1: "Maandag",
    2: "Dinsdag",
    3: "Woensdag",
    4: "Donderdag",
    5: "Vrijdag",
    6: "Zaterdag",
    7: "Zondag"
  };
  const title = zoomMode === "week" ? weekLabels[label] ?? `${label}` : `Leeftijd ${label}`;

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
        zIndex: 5,
        whiteSpace: "nowrap"
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: "4px" }}>
        {title} · {series.label}
        {series.bruto ? <span style={{ fontSize: "10px", opacity: 0.85 }}> bruto</span> : ""}
        {series.netto ? <span style={{ fontSize: "10px", opacity: 0.85 }}> netto</span> : ""}
      </div>
      {showScenarioDetails ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
            <span style={{ width: "8px", height: "8px", background: series.color }} />
            <span style={{ fontSize: "12px" }}>{formatCurrency(betterValue)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
            <span style={{ width: "11px", height: "11px", background: series.color }} />
            <span style={{ fontSize: "14px", fontWeight: 700 }}>{formatCurrency(expectedValue)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", background: series.color }} />
            <span style={{ fontSize: "12px" }}>{formatCurrency(lowerValue)}</span>
          </div>
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "11px", height: "11px", background: series.color }} />
          <span style={{ fontSize: "14px", fontWeight: 700 }}>{formatCurrency(expectedValue)}</span>
        </div>
      )}
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
const parseEuroInput = (value) => {
  const digitsOnly = String(value ?? "").replace(/[^\d]/g, "");
  if (!digitsOnly) {
    return 0;
  }
  return Number(digitsOnly);
};
const formatEuroInput = (value) =>
  new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 }).format(Number(value) || 0);

const normalizeYear = (value, maxYear) => Math.min(maxYear, Math.max(1, Number(value) || 1));
const normalizeMonth = (value) => Math.min(12, Math.max(1, Number(value) || 1));

const InvestmentCalculator = () => {
  const [startAmount, setStartAmount] = useState(0);
  const [phase1MonthlyDeposit, setPhase1MonthlyDeposit] = useState(0);
  const [phase1Years, setPhase1Years] = useState(0);
  const [phase2MonthlyDeposit, setPhase2MonthlyDeposit] = useState(0);
  const [phase2EndYear, setPhase2EndYear] = useState(0);
  const [phase3MonthlyDeposit, setPhase3MonthlyDeposit] = useState(0);
  const [phase3EndYear, setPhase3EndYear] = useState(0);
  const [investmentHorizon, setInvestmentHorizon] = useState(20);
  const [startAge, setStartAge] = useState(18);
  const [startAmount2, setStartAmount2] = useState(0);
  const [phase1MonthlyDeposit2, setPhase1MonthlyDeposit2] = useState(0);
  const [phase1Years2, setPhase1Years2] = useState(0);
  const [phase2MonthlyDeposit2, setPhase2MonthlyDeposit2] = useState(0);
  const [phase2EndYear2, setPhase2EndYear2] = useState(0);
  const [phase3MonthlyDeposit2, setPhase3MonthlyDeposit2] = useState(0);
  const [phase3EndYear2, setPhase3EndYear2] = useState(0);
  const [investmentHorizon2, setInvestmentHorizon2] = useState(20);
  const [startAge2, setStartAge2] = useState(18);
  const [startAmount3, setStartAmount3] = useState(0);
  const [phase1MonthlyDeposit3, setPhase1MonthlyDeposit3] = useState(0);
  const [phase1Years3, setPhase1Years3] = useState(0);
  const [phase2MonthlyDeposit3, setPhase2MonthlyDeposit3] = useState(0);
  const [phase2EndYear3, setPhase2EndYear3] = useState(0);
  const [phase3MonthlyDeposit3, setPhase3MonthlyDeposit3] = useState(0);
  const [phase3EndYear3, setPhase3EndYear3] = useState(0);
  const [investmentHorizon3, setInvestmentHorizon3] = useState(20);
  const [startAge3, setStartAge3] = useState(18);
  const [childAge3, setChildAge3] = useState(1);
  const aowAge = 68;
  const [oneTimeExtras, setOneTimeExtras] = useState([
    { amount: 0, year: 5, month: 6 },
    { amount: 0, year: 5, month: 6 },
    { amount: 0, year: 5, month: 6 }
  ]);
  const [oneTimeExtras2, setOneTimeExtras2] = useState([
    { amount: 0, year: 1, month: 12 },
    { amount: 0, year: 2, month: 12 },
    { amount: 0, year: 3, month: 12 }
  ]);
  const [oneTimeExtras3, setOneTimeExtras3] = useState([
    { amount: 0, year: 5, month: 6 },
    { amount: 0, year: 5, month: 6 },
    { amount: 0, year: 5, month: 6 }
  ]);
  const [startDepositsInYear2, setStartDepositsInYear2] = useState(false);
  const [startDepositsInYear22, setStartDepositsInYear22] = useState(false);
  const [startDepositsInYear23, setStartDepositsInYear23] = useState(false);
  const [profile, setProfile] = useState("Gedreven");
  const [profile2, setProfile2] = useState("Gedreven");
  const [profile3, setProfile3] = useState("Gedreven");
  const [isCalculatorExpanded, setIsCalculatorExpanded] = useState(false);
  const [isCalculatorExpanded2, setIsCalculatorExpanded2] = useState(false);
  const [isCalculatorExpanded3, setIsCalculatorExpanded3] = useState(false);
  const [lifelineZoomMode, setLifelineZoomMode] = useState("week");
  const [activeScenarioBandKey, setActiveScenarioBandKey] = useState(null);
  const [hoveredLifelineSeriesKey, setHoveredLifelineSeriesKey] = useState(null);
  const [isExamplePresetActive, setIsExamplePresetActive] = useState(false);
  const [careerPhaseStartAge, setCareerPhaseStartAge] = useState(18);
  const [careerEndAge, setCareerEndAge] = useState(35);
  const [isDraggingCareerStartAge, setIsDraggingCareerStartAge] = useState(false);
  const [isDraggingCareerEndAge, setIsDraggingCareerEndAge] = useState(false);
  const [cfkPot, setCfkPot] = useState(0);
  const [cfkReturnRate, setCfkReturnRate] = useState(2.5);
  const [cfkDurationMonths, setCfkDurationMonths] = useState(120);
  const [pensionReturnRate, setPensionReturnRate] = useState(2.5);
  const [pensionAowEnabled, setPensionAowEnabled] = useState(false);
  const [pensionYearsAbroad, setPensionYearsAbroad] = useState("");
  const [freeWealthPayouts, setFreeWealthPayouts] = useState([
    { amount: 0, fromAge: 35, toAge: 36 },
    { amount: 0, fromAge: 35, toAge: 36 },
    { amount: 0, fromAge: 35, toAge: 36 }
  ]);
  const [freeWealthSwitchToConservative, setFreeWealthSwitchToConservative] = useState(false);
  const [freeWealthConservativeFromYear, setFreeWealthConservativeFromYear] = useState(1);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hoveredIndex2, setHoveredIndex2] = useState(null);
  const [hoveredIndex3, setHoveredIndex3] = useState(null);
  const [hoveredIncomeIndex, setHoveredIncomeIndex] = useState(null);
  const [hoveredPotIndex, setHoveredPotIndex] = useState(null);
  const chartContainerRef = useRef(null);
  const chartContainerRef2 = useRef(null);
  const chartContainerRef3 = useRef(null);
  const lifelineChartContainerRef = useRef(null);
  const incomeChartContainerRef = useRef(null);
  const potChartContainerRef = useRef(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const [chartSize2, setChartSize2] = useState({ width: 0, height: 0 });
  const [chartSize3, setChartSize3] = useState({ width: 0, height: 0 });
  const [lifelineChartSize, setLifelineChartSize] = useState({ width: 0, height: 0 });
  const [incomeChartSize, setIncomeChartSize] = useState({ width: 0, height: 0 });
  const [potChartSize, setPotChartSize] = useState({ width: 0, height: 0 });
  const subtleOverlayTextColor = "rgba(0,0,0,0.45)";
  const hasCfk = cfkPot > 0;

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
  const annualReturn2 = riskProfiles[profile2];
  const annualReturn3 = riskProfiles[profile3];
  const annualReturnBehouden = riskProfiles.Behouden;
  const careerStartAge = careerPhaseStartAge;
  const cfkStartAge = careerEndAge + 3;
  const freeWealthHorizonAge = startAge + investmentHorizon;
  const freeWealthLastPayoutAge = freeWealthPayouts.reduce(
    (max, row) => (row.amount > 0 ? Math.max(max, row.toAge) : max),
    freeWealthHorizonAge
  );
  const freeWealthVisibleEndAge = Math.max(freeWealthHorizonAge, freeWealthLastPayoutAge);
  const timelineStartAge = Math.min(startAge, startAge2, startAge3);
  const cfkExpectedValueAtPayoutStart = useMemo(() => {
    const cfkGrowthRate = cfkReturnRate / 100;
    const yearsToPayoutStart = Math.max(0, cfkStartAge - careerStartAge);
    return cfkPot * Math.pow(1 + cfkGrowthRate, yearsToPayoutStart);
  }, [cfkPot, cfkReturnRate, cfkStartAge, careerStartAge]);

  const cfkDurationRange = useMemo(() => {
    const amount = cfkExpectedValueAtPayoutStart;
    const ranges = [
      [0, 32249, 1, 12],
      [32249, 43000, 9, 18],
      [43000, 64500, 12, 24],
      [64500, 85999, 18, 36],
      [85999, 107501, 24, 48],
      [107501, 129000, 30, 60],
      [129000, 163531, 36, 72],
      [163531, 204417, 42, 84],
      [204417, 306624, 48, 96],
      [306624, 408832, 54, 108],
      [408832, 613249, 60, 120],
      [613249, 817665, 66, 132],
      [817665, 1022080, 72, 144],
      [1022080, 1226496, 78, 156],
      [1226496, 1430914, 84, 168],
      [1430914, 1635329, 90, 180],
      [1635329, 1839745, 96, 192],
      [1839745, 2044163, 102, 204],
      [2044163, 2452995, 108, 216],
      [2452995, Infinity, 120, 240]
    ];
    const match = ranges.find(([min, max]) => amount >= min && amount < max) || ranges[0];
    return { min: match[2], max: match[3] };
  }, [cfkExpectedValueAtPayoutStart]);

  useEffect(() => {
    setCfkDurationMonths((value) => Math.min(cfkDurationRange.max, Math.max(cfkDurationRange.min, value)));
  }, [cfkDurationRange.max, cfkDurationRange.min]);

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
    const minPhase2End = phase2MonthlyDeposit > 0 || phase3MonthlyDeposit > 0 ? phase1Years : 0;
    if (phase2EndYear < minPhase2End) {
      setPhase2EndYear(minPhase2End);
      return;
    }
    const minPhase3End = phase3MonthlyDeposit > 0 ? phase2EndYear : 0;
    if (phase3EndYear < minPhase3End) {
      setPhase3EndYear(minPhase3End);
    }
  }, [phase1Years, phase2EndYear, phase3EndYear, phase2MonthlyDeposit, phase3MonthlyDeposit, investmentHorizon]);

  useEffect(() => {
    if (phase1Years2 > investmentHorizon2) {
      setPhase1Years2(investmentHorizon2);
      return;
    }
    if (phase2EndYear2 > investmentHorizon2) {
      setPhase2EndYear2(investmentHorizon2);
      return;
    }
    if (phase3EndYear2 > investmentHorizon2) {
      setPhase3EndYear2(investmentHorizon2);
      return;
    }
    const minPhase2End = phase2MonthlyDeposit2 > 0 || phase3MonthlyDeposit2 > 0 ? phase1Years2 : 0;
    if (phase2EndYear2 < minPhase2End) {
      setPhase2EndYear2(minPhase2End);
      return;
    }
    const minPhase3End = phase3MonthlyDeposit2 > 0 ? phase2EndYear2 : 0;
    if (phase3EndYear2 < minPhase3End) {
      setPhase3EndYear2(minPhase3End);
    }
  }, [phase1Years2, phase2EndYear2, phase3EndYear2, phase2MonthlyDeposit2, phase3MonthlyDeposit2, investmentHorizon2]);

  useEffect(() => {
    if (phase1Years3 > investmentHorizon3) {
      setPhase1Years3(investmentHorizon3);
      return;
    }
    if (phase2EndYear3 > investmentHorizon3) {
      setPhase2EndYear3(investmentHorizon3);
      return;
    }
    if (phase3EndYear3 > investmentHorizon3) {
      setPhase3EndYear3(investmentHorizon3);
      return;
    }
    const minPhase2End = phase2MonthlyDeposit3 > 0 || phase3MonthlyDeposit3 > 0 ? phase1Years3 : 0;
    if (phase2EndYear3 < minPhase2End) {
      setPhase2EndYear3(minPhase2End);
      return;
    }
    const minPhase3End = phase3MonthlyDeposit3 > 0 ? phase2EndYear3 : 0;
    if (phase3EndYear3 < minPhase3End) {
      setPhase3EndYear3(minPhase3End);
    }
  }, [phase1Years3, phase2EndYear3, phase3EndYear3, phase2MonthlyDeposit3, phase3MonthlyDeposit3, investmentHorizon3]);

  useEffect(() => {
    if (startAge < 18) {
      setStartAge(18);
      return;
    }
    if (startAge > 50) {
      setStartAge(50);
    }
  }, [startAge]);

  useEffect(() => {
    if (startAge2 < 18) {
      setStartAge2(18);
      return;
    }
    if (startAge2 > 50) {
      setStartAge2(50);
    }
  }, [startAge2]);

  useEffect(() => {
    if (startAge3 < 18) {
      setStartAge3(18);
      return;
    }
    if (startAge3 > 50) {
      setStartAge3(50);
    }
  }, [startAge3]);

  useEffect(() => {
    if (startAmount3 > 6500) {
      setStartAmount3(6500);
    }
    if (startAmount3 < 0) {
      setStartAmount3(0);
    }
  }, [startAmount3]);

  useEffect(() => {
    setChildAge3((prev) => Math.max(1, Math.min(15, prev)));
  }, []);

  useEffect(() => {
    const derivedHorizon = Math.max(1, 18 - childAge3);
    setInvestmentHorizon3(derivedHorizon);
  }, [childAge3]);

  useEffect(() => {
    setFreeWealthPayouts((prev) => {
      const next = prev.map((row) => {
        const amount = clampEuro(row.amount, 0, 5000000);
        const fromAge = Math.max(startAge, Math.round(Number(row.fromAge) || startAge));
        const toAge = Math.max(fromAge, Math.round(Number(row.toAge) || fromAge));
        return { amount, fromAge, toAge };
      });
      const changed = next.some(
        (row, idx) =>
          row.amount !== prev[idx].amount || row.fromAge !== prev[idx].fromAge || row.toAge !== prev[idx].toAge
      );
      return changed ? next : prev;
    });
  }, [startAge]);
  useEffect(() => {
    const maxYear = Math.max(1, investmentHorizon);
    setFreeWealthConservativeFromYear((prev) => {
      const normalized = Math.min(maxYear, Math.max(1, Math.round(Number(prev) || 1)));
      return normalized === prev ? prev : normalized;
    });
  }, [investmentHorizon]);

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

  useEffect(() => {
    setOneTimeExtras2((prev) => {
      const next = prev.map((entry) => ({
        amount: clampEuro(entry.amount, 0, 5000000),
        year: normalizeYear(entry.year, investmentHorizon2),
        month: normalizeMonth(entry.month)
      }));
      const changed = next.some(
        (entry, idx) =>
          entry.amount !== prev[idx].amount || entry.year !== prev[idx].year || entry.month !== prev[idx].month
      );
      return changed ? next : prev;
    });
  }, [investmentHorizon2]);

  useEffect(() => {
    setOneTimeExtras3((prev) => {
      const next = prev.map((entry) => ({
        amount: clampEuro(entry.amount, 0, 5000000),
        year: normalizeYear(entry.year, investmentHorizon3),
        month: normalizeMonth(entry.month)
      }));
      const changed = next.some(
        (entry, idx) =>
          entry.amount !== prev[idx].amount || entry.year !== prev[idx].year || entry.month !== prev[idx].month
      );
      return changed ? next : prev;
    });
  }, [investmentHorizon3]);

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

  const getMonthlyDepositForMonth2 = (absoluteMonth) => {
    const monthInDepositTimeline = startDepositsInYear22 ? absoluteMonth - 12 : absoluteMonth;
    if (monthInDepositTimeline <= 0) {
      return 0;
    }

    const phase1Months = phase1Years2 * 12;
    const phase2Months = phase2EndYear2 * 12;
    const phase3Months = phase3EndYear2 * 12;

    if (monthInDepositTimeline <= phase1Months) {
      return phase1MonthlyDeposit2;
    }
    if (monthInDepositTimeline <= phase2Months) {
      return phase2MonthlyDeposit2;
    }
    if (monthInDepositTimeline <= phase3Months) {
      return phase3MonthlyDeposit2;
    }
    return 0;
  };

  const getOneTimeExtraForMonth2 = (absoluteMonth) =>
    oneTimeExtras2.reduce((sum, entry) => {
      if (entry.amount <= 0) {
        return sum;
      }
      const targetMonth = (entry.year - 1) * 12 + entry.month;
      return sum + (absoluteMonth === targetMonth ? entry.amount : 0);
    }, 0);

  const getMonthlyDepositForMonth3 = (absoluteMonth) => {
    const monthInDepositTimeline = startDepositsInYear23 ? absoluteMonth - 12 : absoluteMonth;
    if (monthInDepositTimeline <= 0) {
      return 0;
    }

    const phase1Months = phase1Years3 * 12;
    const phase2Months = phase2EndYear3 * 12;
    const phase3Months = phase3EndYear3 * 12;

    if (monthInDepositTimeline <= phase1Months) {
      return phase1MonthlyDeposit3;
    }
    if (monthInDepositTimeline <= phase2Months) {
      return phase2MonthlyDeposit3;
    }
    if (monthInDepositTimeline <= phase3Months) {
      return phase3MonthlyDeposit3;
    }
    return 0;
  };

  const getOneTimeExtraForMonth3 = (absoluteMonth) =>
    oneTimeExtras3.reduce((sum, entry) => {
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

  const updateOneTimeExtra2 = (index, key, rawValue) => {
    setOneTimeExtras2((prev) =>
      prev.map((entry, idx) => {
        if (idx !== index) {
          return entry;
        }
        if (key === "amount") {
          return { ...entry, amount: clampEuro(rawValue, 0, 5000000) };
        }
        if (key === "year") {
          return { ...entry, year: normalizeYear(rawValue, investmentHorizon2) };
        }
        return { ...entry, month: normalizeMonth(rawValue) };
      })
    );
  };

  const updateOneTimeExtra3 = (index, key, rawValue) => {
    setOneTimeExtras3((prev) =>
      prev.map((entry, idx) => {
        if (idx !== index) {
          return entry;
        }
        if (key === "amount") {
          return { ...entry, amount: clampEuro(rawValue, 0, 5000000) };
        }
        if (key === "year") {
          return { ...entry, year: normalizeYear(rawValue, investmentHorizon3) };
        }
        return { ...entry, month: normalizeMonth(rawValue) };
      })
    );
  };

  const updateFreeWealthPayout = (index, key, rawValue) => {
    setFreeWealthPayouts((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) {
          return row;
        }
        if (key === "amount") {
          return { ...row, amount: clampEuro(parseEuroInput(rawValue), 0, 5000000) };
        }
        if (key === "fromAge") {
          const fromAge = Math.max(startAge, Math.round(Number(rawValue) || startAge));
          return { ...row, fromAge, toAge: Math.max(fromAge, row.toAge) };
        }
        const toAge = Math.max(row.fromAge, Math.round(Number(rawValue) || row.fromAge));
        return { ...row, toAge };
      })
    );
  };

  const applyDefaultPreset = () => {
    setCfkPot(0);
    setCfkReturnRate(2.5);
    setCfkDurationMonths(12);
    setCareerPhaseStartAge(18);
    setCareerEndAge(35);

    setStartAmount(0);
    setStartAge(18);
    setPhase1MonthlyDeposit(0);
    setPhase1Years(0);
    setPhase2MonthlyDeposit(0);
    setPhase2EndYear(0);
    setPhase3MonthlyDeposit(0);
    setPhase3EndYear(0);
    setInvestmentHorizon(20);
    setProfile("Gedreven");
    setStartDepositsInYear2(false);
    setOneTimeExtras([
      { amount: 0, year: 5, month: 6 },
      { amount: 0, year: 5, month: 6 },
      { amount: 0, year: 5, month: 6 }
    ]);
    setFreeWealthPayouts([
      { amount: 0, fromAge: 35, toAge: 36 },
      { amount: 0, fromAge: 35, toAge: 36 },
      { amount: 0, fromAge: 35, toAge: 36 }
    ]);
    setFreeWealthSwitchToConservative(false);
    setFreeWealthConservativeFromYear(1);

    setStartAmount2(0);
    setStartAge2(18);
    setPhase1MonthlyDeposit2(0);
    setPhase1Years2(0);
    setPhase2MonthlyDeposit2(0);
    setPhase2EndYear2(0);
    setPhase3MonthlyDeposit2(0);
    setPhase3EndYear2(0);
    setInvestmentHorizon2(20);
    setProfile2("Gedreven");
    setStartDepositsInYear22(false);
    setOneTimeExtras2([
      { amount: 0, year: 1, month: 12 },
      { amount: 0, year: 2, month: 12 },
      { amount: 0, year: 3, month: 12 }
    ]);
    setPensionReturnRate(2.5);
    setPensionAowEnabled(false);
    setPensionYearsAbroad("");

    setStartAmount3(0);
    setStartAge3(18);
    setChildAge3(1);
    setPhase1MonthlyDeposit3(0);
    setPhase1Years3(0);
    setPhase2MonthlyDeposit3(0);
    setPhase2EndYear3(0);
    setPhase3MonthlyDeposit3(0);
    setPhase3EndYear3(0);
    setInvestmentHorizon3(17);
    setProfile3("Gedreven");
    setStartDepositsInYear23(false);
    setOneTimeExtras3([
      { amount: 0, year: 5, month: 6 },
      { amount: 0, year: 5, month: 6 },
      { amount: 0, year: 5, month: 6 }
    ]);
  };

  const applyExamplePreset = () => {
    setCareerPhaseStartAge(18);
    setCareerEndAge(35);

    setCfkPot(400000);
    setCfkReturnRate(2.5);
    setCfkDurationMonths(132);

    setStartAmount(150000);
    setStartAge(28);
    setPhase1MonthlyDeposit(2500);
    setPhase1Years(7);
    setPhase2MonthlyDeposit(0);
    setPhase2EndYear(0);
    setPhase3MonthlyDeposit(0);
    setPhase3EndYear(0);
    setInvestmentHorizon(45);
    setProfile("Behouden");
    setStartDepositsInYear2(false);
    setOneTimeExtras([
      { amount: 0, year: 5, month: 6 },
      { amount: 0, year: 5, month: 6 },
      { amount: 0, year: 5, month: 6 }
    ]);

    setFreeWealthPayouts([
      { amount: 50000, fromAge: 36, toAge: 37 },
      { amount: 55000, fromAge: 50, toAge: 66 },
      { amount: 29859, fromAge: 67, toAge: 67 }
    ]);
    setFreeWealthSwitchToConservative(false);
    setFreeWealthConservativeFromYear(1);

    setStartAmount2(25000);
    setStartAge2(28);
    setPhase1MonthlyDeposit2(0);
    setPhase1Years2(0);
    setPhase2MonthlyDeposit2(0);
    setPhase2EndYear2(0);
    setPhase3MonthlyDeposit2(0);
    setPhase3EndYear2(0);
    setInvestmentHorizon2(20);
    setProfile2("Gedreven");
    setStartDepositsInYear22(false);
    setOneTimeExtras2([
      { amount: 25000, year: 2, month: 12 },
      { amount: 0, year: 2, month: 12 },
      { amount: 0, year: 3, month: 12 }
    ]);
    setPensionReturnRate(2.5);
    setPensionAowEnabled(true);
    setPensionYearsAbroad("2");

    setStartAmount3(6500);
    setStartAge3(28);
    setChildAge3(3);
    setPhase1MonthlyDeposit3(0);
    setPhase1Years3(0);
    setPhase2MonthlyDeposit3(0);
    setPhase2EndYear3(0);
    setPhase3MonthlyDeposit3(0);
    setPhase3EndYear3(0);
    setInvestmentHorizon3(15);
    setProfile3("Gedreven");
    setStartDepositsInYear23(false);
    setOneTimeExtras3([
      { amount: 0, year: 5, month: 6 },
      { amount: 0, year: 5, month: 6 },
      { amount: 0, year: 5, month: 6 }
    ]);
  };

  const toggleExamplePreset = () => {
    if (isExamplePresetActive) {
      applyDefaultPreset();
      setActiveScenarioBandKey(null);
      setIsExamplePresetActive(false);
      return;
    }
    applyExamplePreset();
    setActiveScenarioBandKey(null);
    setIsExamplePresetActive(true);
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

  const calculationData2 = useMemo(() => {
    const data = [];
    let currentBalance = startAmount2;
    let totalExtraDeposits = 0;

    const monthlyReturn = annualReturn2 / 12;

    for (let year = 1; year <= investmentHorizon2; year++) {
      const yearStartBalance = currentBalance;

      for (let month = 1; month <= 12; month++) {
        const currentMonth = (year - 1) * 12 + month;
        const activeDeposit = getMonthlyDepositForMonth2(currentMonth);
        const oneTimeExtra = getOneTimeExtraForMonth2(currentMonth);

        currentBalance = currentBalance * (1 + monthlyReturn);
        currentBalance += activeDeposit;
        currentBalance += oneTimeExtra;
        totalExtraDeposits += activeDeposit + oneTimeExtra;
      }

      const totalDeposits = startAmount2 + totalExtraDeposits;
      const accruedInterest = currentBalance - totalDeposits;

      data.push({
        year,
        balance: currentBalance,
        deposits: totalExtraDeposits,
        interest: accruedInterest,
        initialBalance: startAmount2,
        yearStartBalance
      });
    }

    return data;
  }, [
    startAmount2,
    phase1MonthlyDeposit2,
    phase1Years2,
    phase2MonthlyDeposit2,
    phase2EndYear2,
    phase3MonthlyDeposit2,
    phase3EndYear2,
    oneTimeExtras2,
    startDepositsInYear22,
    investmentHorizon2,
    annualReturn2
  ]);

  const finalBalance2 = calculationData2[calculationData2.length - 1]?.balance || 0;

  const calculationData3 = useMemo(() => {
    const data = [];
    let currentBalance = 0;
    let totalExtraDeposits = 0;

    const monthlyReturn = annualReturn3 / 12;

    for (let year = 1; year <= investmentHorizon3; year++) {
      const yearStartBalance = currentBalance;

      for (let month = 1; month <= 12; month++) {
        currentBalance = currentBalance * (1 + monthlyReturn);
      }

      // Jaarlijkse eenmalige inleg gelijk aan startbedrag.
      currentBalance += startAmount3;
      totalExtraDeposits += startAmount3;

      const totalDeposits = totalExtraDeposits;
      const accruedInterest = currentBalance - totalDeposits;

      data.push({
        year,
        balance: currentBalance,
        deposits: totalExtraDeposits,
        interest: accruedInterest,
        initialBalance: 0,
        yearStartBalance
      });
    }

    return data;
  }, [
    startAmount3,
    investmentHorizon3,
    annualReturn3
  ]);

  const finalBalance3 = calculationData3[calculationData3.length - 1]?.balance || 0;

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

  useEffect(() => {
    const updateSize = () => {
      if (!potChartContainerRef.current) {
        return;
      }
      setPotChartSize({
        width: potChartContainerRef.current.clientWidth,
        height: potChartContainerRef.current.clientHeight
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (!chartContainerRef2.current) {
        return;
      }
      setChartSize2({
        width: chartContainerRef2.current.clientWidth,
        height: chartContainerRef2.current.clientHeight
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (!chartContainerRef3.current) {
        return;
      }
      setChartSize3({
        width: chartContainerRef3.current.clientWidth,
        height: chartContainerRef3.current.clientHeight
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (!lifelineChartContainerRef.current) {
        return;
      }
      setLifelineChartSize({
        width: lifelineChartContainerRef.current.clientWidth,
        height: lifelineChartContainerRef.current.clientHeight
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (!incomeChartContainerRef.current) {
        return;
      }
      setIncomeChartSize({
        width: incomeChartContainerRef.current.clientWidth,
        height: incomeChartContainerRef.current.clientHeight
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const minCareerEnd = careerStartAge + 1;
    const maxCareerEnd = 50;
    setCareerEndAge((prev) => Math.min(maxCareerEnd, Math.max(minCareerEnd, prev)));
  }, [careerStartAge]);

  useEffect(() => {
    const minCareerStart = 18;
    const maxCareerStart = Math.max(minCareerStart, careerEndAge - 1);
    setCareerPhaseStartAge((prev) => Math.min(maxCareerStart, Math.max(minCareerStart, prev)));
  }, [careerEndAge]);

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

  const calculateWorstCase2 = () => {
    let currentBalance = startAmount2;
    const monthlyReturn = worstCaseProfiles[profile2] / 12;

    for (let year = 1; year <= investmentHorizon2; year++) {
      for (let month = 1; month <= 12; month++) {
        const currentMonth = (year - 1) * 12 + month;
        const activeDeposit = getMonthlyDepositForMonth2(currentMonth);
        const oneTimeExtra = getOneTimeExtraForMonth2(currentMonth);

        currentBalance = currentBalance * (1 + monthlyReturn);
        currentBalance += activeDeposit;
        currentBalance += oneTimeExtra;
      }
    }
    return currentBalance;
  };

  const calculateBestCase2 = () => {
    let currentBalance = startAmount2;
    const monthlyReturn = bestCaseProfiles[profile2] / 12;

    for (let year = 1; year <= investmentHorizon2; year++) {
      for (let month = 1; month <= 12; month++) {
        const currentMonth = (year - 1) * 12 + month;
        const activeDeposit = getMonthlyDepositForMonth2(currentMonth);
        const oneTimeExtra = getOneTimeExtraForMonth2(currentMonth);

        currentBalance = currentBalance * (1 + monthlyReturn);
        currentBalance += activeDeposit;
        currentBalance += oneTimeExtra;
      }
    }
    return currentBalance;
  };

  const worstCaseBalance2 = calculateWorstCase2();
  const bestCaseBalance2 = calculateBestCase2();

  const calculateWorstCase3 = () => {
    let currentBalance = 0;
    const monthlyReturn = worstCaseProfiles[profile3] / 12;

    for (let year = 1; year <= investmentHorizon3; year++) {
      for (let month = 1; month <= 12; month++) {
        currentBalance = currentBalance * (1 + monthlyReturn);
      }
      currentBalance += startAmount3;
    }
    return currentBalance;
  };

  const calculateBestCase3 = () => {
    let currentBalance = 0;
    const monthlyReturn = bestCaseProfiles[profile3] / 12;

    for (let year = 1; year <= investmentHorizon3; year++) {
      for (let month = 1; month <= 12; month++) {
        currentBalance = currentBalance * (1 + monthlyReturn);
      }
      currentBalance += startAmount3;
    }
    return currentBalance;
  };

  const worstCaseBalance3 = calculateWorstCase3();
  const bestCaseBalance3 = calculateBestCase3();

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
  const hoveredPoint2 = hoveredIndex2 != null ? calculationData2[hoveredIndex2] : null;
  const hoveredPoint3 = hoveredIndex3 != null ? calculationData3[hoveredIndex3] : null;

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

  const tooltipAnchor2 = useMemo(() => {
    if (!hoveredPoint2 || !chartSize2.width || !chartSize2.height || calculationData2.length === 0) {
      return null;
    }

    const margin = { top: 20, right: 30, left: 20, bottom: 40 };
    const yAxisWidth = 70;
    const plotWidth = chartSize2.width - margin.left - margin.right - yAxisWidth;
    const plotHeight = chartSize2.height - margin.top - margin.bottom;
    if (plotWidth <= 0 || plotHeight <= 0) {
      return null;
    }

    const step = plotWidth / calculationData2.length;
    const left = margin.left + yAxisWidth + step * hoveredIndex2 + step / 2;
    const maxTotal = Math.max(
      ...calculationData2.map((row) => row.initialBalance + row.deposits + Math.max(0, row.interest)),
      1
    );
    const total = hoveredPoint2.initialBalance + hoveredPoint2.deposits + Math.max(0, hoveredPoint2.interest);
    const top = margin.top + (1 - total / maxTotal) * plotHeight;

    return { left, top };
  }, [calculationData2, chartSize2.height, chartSize2.width, hoveredIndex2, hoveredPoint2]);

  const tooltipAnchor3 = useMemo(() => {
    if (!hoveredPoint3 || !chartSize3.width || !chartSize3.height || calculationData3.length === 0) {
      return null;
    }

    const margin = { top: 20, right: 30, left: 20, bottom: 40 };
    const yAxisWidth = 70;
    const plotWidth = chartSize3.width - margin.left - margin.right - yAxisWidth;
    const plotHeight = chartSize3.height - margin.top - margin.bottom;
    if (plotWidth <= 0 || plotHeight <= 0) {
      return null;
    }

    const step = plotWidth / calculationData3.length;
    const left = margin.left + yAxisWidth + step * hoveredIndex3 + step / 2;
    const maxTotal = Math.max(
      ...calculationData3.map((row) => row.initialBalance + row.deposits + Math.max(0, row.interest)),
      1
    );
    const total = hoveredPoint3.initialBalance + hoveredPoint3.deposits + Math.max(0, hoveredPoint3.interest);
    const top = margin.top + (1 - total / maxTotal) * plotHeight;

    return { left, top };
  }, [calculationData3, chartSize3.height, chartSize3.width, hoveredIndex3, hoveredPoint3]);
  const barYearTicks = useMemo(() => {
    const horizon = Math.max(1, investmentHorizon);
    let step = 1;
    if (horizon > 40) {
      step = 5;
    } else if (horizon > 30) {
      step = 4;
    } else if (horizon > 20) {
      step = 2;
    }
    const ticks = [];
    for (let year = 1; year <= horizon; year += step) {
      ticks.push(year);
    }
    if (ticks[ticks.length - 1] !== horizon) {
      ticks.push(horizon);
    }
    return ticks;
  }, [investmentHorizon]);

  const barYearTicks2 = useMemo(() => {
    const horizon = Math.max(1, investmentHorizon2);
    let step = 1;
    if (horizon > 40) {
      step = 5;
    } else if (horizon > 30) {
      step = 4;
    } else if (horizon > 20) {
      step = 2;
    }
    const ticks = [];
    for (let year = 1; year <= horizon; year += step) {
      ticks.push(year);
    }
    if (ticks[ticks.length - 1] !== horizon) {
      ticks.push(horizon);
    }
    return ticks;
  }, [investmentHorizon2]);

  const barYearTicks3 = useMemo(() => {
    const horizon = Math.max(1, investmentHorizon3);
    let step = 1;
    if (horizon > 40) {
      step = 5;
    } else if (horizon > 30) {
      step = 4;
    } else if (horizon > 20) {
      step = 2;
    }
    const ticks = [];
    for (let year = 1; year <= horizon; year += step) {
      ticks.push(year);
    }
    if (ticks[ticks.length - 1] !== horizon) {
      ticks.push(horizon);
    }
    return ticks;
  }, [investmentHorizon3]);

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

  const lifeline = useMemo(() => {
    const careerEndValue =
      calculationData[Math.max(0, Math.min(calculationData.length - 1, careerEndAge - startAge - 1))]?.balance ??
      startAmount;
    const cfkDurationYears = cfkDurationMonths / 12;
    const cfkGrowthRate = cfkReturnRate / 100;
    const cfkMonthlyReturn = cfkGrowthRate / 12;
    const cfkYearsToCareerEnd = Math.max(0, careerEndAge - careerStartAge);
    const cfkYearsToPayoutStart = Math.max(0, cfkStartAge - careerStartAge);
    const cfkMonthsToCareerEnd = Math.max(0, cfkYearsToCareerEnd * 12);
    const cfkMonthsToPayoutStart = Math.max(0, cfkYearsToPayoutStart * 12);
    const cfkBalanceAtCareerEnd = cfkPot * Math.pow(1 + cfkMonthlyReturn, cfkMonthsToCareerEnd);
    const cfkBalanceAtPayoutStart = cfkPot * Math.pow(1 + cfkMonthlyReturn, cfkMonthsToPayoutStart);
    const cfkMonthlyPayoutFixed =
      cfkDurationMonths > 0 ? Math.floor(cfkBalanceAtPayoutStart / cfkDurationMonths) : 0;
    const cfkAnnualPayout = cfkMonthlyPayoutFixed * 12;
    const cfkPayoutEndAge = cfkStartAge + cfkDurationYears;

    const getPensionBalanceAtAge = (age) => {
      if (age < startAge2) {
        return 0;
      }
      let balance = startAmount2;
      const months = (age - startAge2) * 12;
      for (let month = 1; month <= months; month++) {
        const withinCalculatorHorizon = month <= investmentHorizon2 * 12;
        const activeDeposit = withinCalculatorHorizon ? getMonthlyDepositForMonth2(month) : 0;
        const oneTimeExtra = withinCalculatorHorizon ? getOneTimeExtraForMonth2(month) : 0;
        balance = balance * (1 + annualReturn2 / 12);
        balance += activeDeposit + oneTimeExtra;
      }
      return Math.max(0, balance);
    };
    const getNextGenerationBalanceAtAge = (age) => {
      if (age < startAge3) {
        return 0;
      }
      let balance = 0;
      const months = (age - startAge3) * 12;
      for (let month = 1; month <= months; month++) {
        balance = balance * (1 + annualReturn3 / 12);
        const withinCalculatorHorizon = month <= investmentHorizon3 * 12;
        const isYearlyDepositMonth = month % 12 === 0;
        if (withinCalculatorHorizon && isYearlyDepositMonth) {
          balance += startAmount3;
        }
      }
      return Math.max(0, balance);
    };
    const pensionCapitalAtAow = getPensionBalanceAtAge(aowAge);
    const pensionPayoutGrowthRate = pensionReturnRate / 100;
    const pensionMaxAnnualGross = 27192; // 2026 grensbedrag
    const getAnnuityAnnualPayout = (capital, years, annualGrowthRate) => {
      if (capital <= 0 || years <= 0) {
        return 0;
      }
      if (annualGrowthRate === 0) {
        return capital / years;
      }
      const discountFactor = 1 - Math.pow(1 + annualGrowthRate, -years);
      if (discountFactor <= 0) {
        return capital / years;
      }
      return (capital * annualGrowthRate) / discountFactor;
    };

    const getPensionPayoutPlan = (capital, annualGrowthRate, maxAnnualGross) => {
      if (capital <= 0) {
        return { years: 0, annualPayout: 0, route: "none" };
      }

      // Korte route: 5 t/m 19 jaar, alleen toegestaan als annuïtaire jaaruitkering <= fiscale grens.
      for (let years = 5; years < 20; years++) {
        const annuityPayout = getAnnuityAnnualPayout(capital, years, annualGrowthRate);
        if (annuityPayout <= maxAnnualGross) {
          return { years, annualPayout: annuityPayout, route: "short" };
        }
      }

      // Lange route: 20 jaar, zonder jaarlijkse grens op 27.192.
      return {
        years: 20,
        annualPayout: getAnnuityAnnualPayout(capital, 20, annualGrowthRate),
        route: "long"
      };
    };

    const pensionPlan = getPensionPayoutPlan(
      pensionCapitalAtAow,
      pensionPayoutGrowthRate,
      pensionMaxAnnualGross
    );
    const pensionPayoutYears = pensionPlan.years;
    const pensionAnnualPayout = pensionPlan.annualPayout;
    const aowAnnualGross = 14380;
    const yearsAbroad = Math.max(0, Math.floor(Number(pensionYearsAbroad) || 0));
    const aowReductionFactor = Math.max(0, 1 - yearsAbroad * 0.02);
    const aowAnnualIncome = pensionAowEnabled ? Math.round(aowAnnualGross * aowReductionFactor) : 0;

    let freeWealthBalance = startAmount;
    let pensionBalance = 0;
    let pensionBalanceDuringPayout = pensionCapitalAtAow;
    let nextGenerationBalance = 0;
    let freeWealthEndAge = startAge + investmentHorizon;
    const nextGenerationHorizonAge = startAge3 + investmentHorizon3;
    const maxPayoutToAge = freeWealthPayouts.reduce(
      (max, row) => (row.amount > 0 ? Math.max(max, row.toAge) : max),
      startAge
    );

    const maxAge = Math.ceil(
      Math.max(
        cfkPayoutEndAge,
        maxPayoutToAge + 5,
        startAge + investmentHorizon + 1,
        startAge3 + investmentHorizon3 + 1,
        aowAge + pensionPayoutYears,
        aowAge + 1,
        careerEndAge + 1,
        88
      )
    );

    const incomeData = [];
    const potData = [];

    const cfkYearStartBalanceByAge = new Map();
    const cfkYearIncomeByAge = new Map();
    let cfkSimBalance = cfkPot;

    for (let age = careerStartAge; age <= maxAge; age++) {

      cfkYearStartBalanceByAge.set(age, cfkSimBalance);

      // Growth-only period before CFK payout starts.
      if (age < cfkStartAge) {
        for (let month = 1; month <= 12; month++) {
          cfkSimBalance = cfkSimBalance * (1 + cfkMonthlyReturn);
        }
        cfkYearIncomeByAge.set(age, 0);
        continue;
      }

      // CFK payout period with slotuitkering in the final month.
      const payoutEndMonthAbsolute = (cfkStartAge - careerStartAge) * 12 + cfkDurationMonths;
      const yearStartMonthAbsolute = (age - careerStartAge) * 12;
      const yearEndMonthAbsolute = yearStartMonthAbsolute + 12;
      const payoutMonthsInThisYear = Math.max(
        0,
        Math.min(yearEndMonthAbsolute, payoutEndMonthAbsolute) - yearStartMonthAbsolute
      );

      if (payoutMonthsInThisYear <= 0 || cfkSimBalance <= 0) {
        cfkYearIncomeByAge.set(age, 0);
        continue;
      }

      let yearIncome = 0;

      for (let month = 1; month <= payoutMonthsInThisYear; month++) {
        cfkSimBalance = cfkSimBalance * (1 + cfkMonthlyReturn);
        const regularPayout = Math.min(cfkMonthlyPayoutFixed, cfkSimBalance);
        cfkSimBalance = Math.max(0, cfkSimBalance - regularPayout);
        yearIncome += regularPayout;

        const currentAbsoluteMonth = yearStartMonthAbsolute + month;
        if (currentAbsoluteMonth === payoutEndMonthAbsolute) {
          // Article 10 Slotuitkering: pay out all residual value at the end with accrued return.
          yearIncome += cfkSimBalance;
          cfkSimBalance = 0;
        }
      }

      cfkYearIncomeByAge.set(age, yearIncome);
    }

    for (let age = timelineStartAge; age <= maxAge; age++) {
      let cfkIncome = 0;
      let freeIncome = 0;
      let pensionIncome = 0;
      let aowIncome = 0;
      const cfkBalance = cfkYearStartBalanceByAge.get(age) ?? 0;
      cfkIncome = cfkYearIncomeByAge.get(age) ?? 0;

      const freeWealthIsActive = age >= startAge;
      if (freeWealthIsActive) {
        const plannedFreeIncome = freeWealthPayouts.reduce((sum, row) => {
          if (row.amount <= 0) {
            return sum;
          }
          return age >= row.fromAge && age <= row.toAge ? sum + row.amount : sum;
        }, 0);

        if (plannedFreeIncome > 0 && freeWealthBalance > 0) {
          freeIncome = Math.min(plannedFreeIncome, freeWealthBalance);
          freeWealthBalance = Math.max(0, freeWealthBalance - freeIncome);
          if (freeWealthBalance === 0) {
            freeWealthEndAge = age;
          }
        }
      }

      const freeWealthBalanceForAge = freeWealthIsActive ? freeWealthBalance : null;

      if (age < aowAge) {
        pensionBalance = getPensionBalanceAtAge(age);
      } else if (age < aowAge + pensionPayoutYears && pensionPayoutYears > 0) {
        pensionBalance = pensionBalanceDuringPayout;
        const grownPensionBalance = pensionBalanceDuringPayout * (1 + pensionPayoutGrowthRate);
        const annuityPayout = Math.min(pensionAnnualPayout, grownPensionBalance);
        pensionIncome = annuityPayout;
        pensionBalanceDuringPayout = Math.max(0, grownPensionBalance - annuityPayout);
      } else if (age >= aowAge + pensionPayoutYears) {
        pensionBalance = 0;
      }

      if (age >= aowAge && aowAnnualIncome > 0) {
        aowIncome = aowAnnualIncome;
      }

      if (age >= startAge3 && age <= nextGenerationHorizonAge) {
        nextGenerationBalance = getNextGenerationBalanceAtAge(age);
      } else {
        nextGenerationBalance = 0;
      }

      incomeData.push({
        age,
        aow: aowIncome,
        cfk: cfkIncome,
        vrij: freeIncome,
        pensioen: pensionIncome
      });

      potData.push({
        age,
        cfk: cfkBalance,
        vrij: freeWealthBalanceForAge,
        pensioen: pensionBalance,
        nextgen: age >= startAge3 && age <= nextGenerationHorizonAge ? nextGenerationBalance : null
      });

      if (freeWealthIsActive) {
        const yearOffset = age - startAge;
        for (let month = 1; month <= 12; month++) {
          const absoluteMonth = yearOffset * 12 + month;
          const withinCalculatorHorizon = absoluteMonth <= investmentHorizon * 12;
          const activeDeposit = withinCalculatorHorizon ? getMonthlyDepositForMonth(absoluteMonth) : 0;
          const oneTimeExtra = withinCalculatorHorizon ? getOneTimeExtraForMonth(absoluteMonth) : 0;
          const freeWealthTimelineYear = Math.ceil(absoluteMonth / 12);
          const useConservativeReturn =
            freeWealthSwitchToConservative &&
            freeWealthTimelineYear >= freeWealthConservativeFromYear &&
            annualReturn !== annualReturnBehouden;
          const activeAnnualReturn = useConservativeReturn ? annualReturnBehouden : annualReturn;
          freeWealthBalance = freeWealthBalance * (1 + activeAnnualReturn / 12);
          freeWealthBalance += activeDeposit + oneTimeExtra;
        }
      }
    }

    return {
      incomeData,
      potData,
      careerEndValue,
      freeWealthStartValue:
        potData.find((row) => row.age === maxPayoutToAge)?.vrij ??
        potData[0]?.vrij ??
        startAmount,
      cfkAnnualPayout,
      cfkBalanceAtCareerEnd,
      cfkBalanceAtPayoutStart,
      cfkPayoutEndAge,
      pensionCapitalAtAow,
      pensionAnnualPayout,
      pensionPayoutYears,
      aowAnnualIncome,
      freeWealthEndAge,
      nextGenerationHorizonAge,
      maxAge
    };
  }, [
    aowAge,
    annualReturn,
    annualReturn2,
    annualReturn3,
    calculationData,
    careerStartAge,
    careerEndAge,
    cfkDurationMonths,
    cfkPot,
    cfkReturnRate,
    cfkStartAge,
    freeWealthPayouts,
    getMonthlyDepositForMonth,
    getOneTimeExtraForMonth,
    investmentHorizon,
    investmentHorizon2,
    investmentHorizon3,
    freeWealthSwitchToConservative,
    freeWealthConservativeFromYear,
    getMonthlyDepositForMonth2,
    getMonthlyDepositForMonth3,
    getOneTimeExtraForMonth2,
    getOneTimeExtraForMonth3,
    pensionAowEnabled,
    pensionReturnRate,
    pensionYearsAbroad,
    annualReturnBehouden,
    startAge,
    startAge2,
    startAge3,
    startAmount,
    startAmount2,
    startAmount3,
    timelineStartAge
  ]);

  const lifelineTicks = useMemo(() => {
    const span = Math.max(1, lifeline.maxAge - timelineStartAge);
    let step = 1;
    if (span > 40) {
      step = 5;
    } else if (span > 25) {
      step = 4;
    } else if (span > 15) {
      step = 2;
    }
    const ticks = [];
    for (let age = timelineStartAge; age <= lifeline.maxAge; age += step) {
      ticks.push(age);
    }
    if (ticks[ticks.length - 1] !== lifeline.maxAge) {
      ticks.push(lifeline.maxAge);
    }
    return ticks;
  }, [lifeline.maxAge, timelineStartAge]);
  const lifelineFullMaxAge = Math.max(88, lifeline.maxAge);
  const lifelineFullTicks = useMemo(() => {
    const span = Math.max(1, lifelineFullMaxAge - timelineStartAge);
    let step = 1;
    if (span > 40) {
      step = 5;
    } else if (span > 25) {
      step = 4;
    } else if (span > 15) {
      step = 2;
    }
    const ticks = [];
    for (let age = timelineStartAge; age <= lifelineFullMaxAge; age += step) {
      ticks.push(age);
    }
    if (ticks[ticks.length - 1] !== lifelineFullMaxAge) {
      ticks.push(lifelineFullMaxAge);
    }
    return ticks;
  }, [lifelineFullMaxAge, timelineStartAge]);

  const lifelinePhases = useMemo(() => {
    const maxPayoutToAge = freeWealthPayouts.reduce(
      (max, row) => (row.amount > 0 ? Math.max(max, row.toAge) : max),
      startAge
    );
    const freeEnd = Math.max(maxPayoutToAge + 1, lifeline.freeWealthEndAge);
    const pensionEnd = aowAge + lifeline.pensionPayoutYears;
    return [
      { key: "career", label: "Carrière", start: careerStartAge, end: careerEndAge, color: "rgba(101,195,104,0.18)" },
      { key: "bridge", label: "Vrij Vermogen Animo", start: careerEndAge, end: cfkStartAge, color: "transparent" },
      { key: "cfk", label: "CFK", start: cfkStartAge, end: lifeline.cfkPayoutEndAge, color: "rgba(13,42,40,0.14)" },
      { key: "free", label: "Vrije periode", start: lifeline.cfkPayoutEndAge, end: freeEnd, color: "transparent" },
      { key: "pension", label: "Pensioen Animo", start: aowAge, end: pensionEnd, color: "rgba(102,114,168,0.14)" },
      { key: "aow", label: "AOW-uitkering", start: aowAge, end: lifeline.maxAge, color: "transparent" }
    ];
  }, [
    aowAge,
    careerStartAge,
    careerEndAge,
    cfkStartAge,
    freeWealthPayouts,
    startAge,
    lifeline.cfkPayoutEndAge,
    lifeline.freeWealthEndAge,
    lifeline.pensionPayoutYears,
    lifeline.maxAge
  ]);
  const lifelineFreeWealthPayoutAreas = useMemo(() => {
    const payoutAges = lifeline.incomeData
      .filter((row) => (row.vrij || 0) > 0)
      .map((row) => row.age)
      .sort((a, b) => a - b);

    if (payoutAges.length === 0) {
      return [];
    }

    const mergedRanges = [];
    let currentStart = payoutAges[0];
    let currentEnd = payoutAges[0];

    for (let i = 1; i < payoutAges.length; i++) {
      const age = payoutAges[i];
      if (age <= currentEnd + 1) {
        currentEnd = age;
        continue;
      }
      mergedRanges.push({ start: currentStart - 0.5, end: currentEnd + 0.5 });
      currentStart = age;
      currentEnd = age;
    }
    mergedRanges.push({ start: currentStart - 0.5, end: currentEnd + 0.5 });

    return mergedRanges;
  }, [lifeline.incomeData]);

  const freeWealthScenarioLowFactor = finalBalance > 0 ? worstCaseBalance / finalBalance : 1;
  const freeWealthScenarioHighFactor = finalBalance > 0 ? bestCaseBalance / finalBalance : 1;
  const pensionScenarioLowFactor = finalBalance2 > 0 ? worstCaseBalance2 / finalBalance2 : 1;
  const pensionScenarioHighFactor = finalBalance2 > 0 ? bestCaseBalance2 / finalBalance2 : 1;

  const lifelineCfkGraphData = useMemo(() => {
    const cfkState = { seenPositive: false, hitZero: false };
    const vvaState = { seenPositive: false, hitZero: false };
    const pensioenState = { seenPositive: false, hitZero: false };
    const nextgenState = { seenPositive: false, hitZero: false };

    const normalizeSeriesValue = (rawValue, state) => {
      if (rawValue == null) {
        return null;
      }
      if (state.hitZero) {
        return null;
      }
      const numericValue = Number(rawValue) || 0;
      if (numericValue > 0) {
        state.seenPositive = true;
        return numericValue;
      }
      if (state.seenPositive && numericValue <= 0) {
        state.hitZero = true;
        return 0;
      }
      return numericValue;
    };
    return lifeline.potData.map((row) => {
      const rawCfk = hasCfk && row.age >= careerStartAge ? row.cfk : null;
      const rawVva = row.age >= startAge && row.age <= freeWealthVisibleEndAge ? row.vrij : null;
      const rawPensioen = row.age >= startAge2 ? row.pensioen : null;
      const rawNextGen =
        row.age >= startAge3 && row.age <= lifeline.nextGenerationHorizonAge ? row.nextgen : null;

      const cfkValue = normalizeSeriesValue(rawCfk, cfkState);
      const vvaValue = normalizeSeriesValue(rawVva, vvaState);
      const pensioenValue = normalizeSeriesValue(rawPensioen, pensioenState);
      const nextgenValue = normalizeSeriesValue(rawNextGen, nextgenState);

      return {
        age: row.age,
        cfk: cfkValue,
        vva: vvaValue,
        vvaLow: vvaValue != null ? vvaValue * freeWealthScenarioLowFactor : null,
        vvaHigh: vvaValue != null ? vvaValue * freeWealthScenarioHighFactor : null,
        vvaBand:
          vvaValue != null
            ? Math.max(0, vvaValue * (freeWealthScenarioHighFactor - freeWealthScenarioLowFactor))
            : null,
        pensioenLow: pensioenValue != null ? pensioenValue * pensionScenarioLowFactor : null,
        pensioenHigh: pensioenValue != null ? pensioenValue * pensionScenarioHighFactor : null,
        pensioenBand:
          pensioenValue != null
            ? Math.max(0, pensioenValue * (pensionScenarioHighFactor - pensionScenarioLowFactor))
            : null,
        pensioen: pensioenValue,
        nextgen: nextgenValue
      };
    });
  }, [
    hasCfk,
    lifeline.potData,
    freeWealthVisibleEndAge,
    freeWealthScenarioLowFactor,
    freeWealthScenarioHighFactor,
    pensionScenarioLowFactor,
    pensionScenarioHighFactor,
    startAge,
    startAge2,
    startAge3,
    careerStartAge
  ]);
  const hasPension = (lifeline.pensionCapitalAtAow ?? 0) > 0;
  const hasAowIncome = pensionAowEnabled && (lifeline.aowAnnualIncome || 0) > 0;
  const hasNextGeneration = lifeline.potData.some((row) => (row.nextgen || 0) > 0);
  const lifelineWeekGraphData = useMemo(() => {
    const firstRow = lifelineCfkGraphData[0] ?? { cfk: null, vva: 0, pensioen: 0, nextgen: 0 };
    const cfkStartRow = lifelineCfkGraphData.find((row) => row.age >= careerStartAge && row.cfk != null) ?? firstRow;
    const vvaStartRow = lifelineCfkGraphData.find((row) => row.age >= startAge && row.vva != null) ?? firstRow;
    const nextGenStartRow = lifelineCfkGraphData.find((row) => row.age >= startAge3 && row.nextgen != null) ?? firstRow;
    const weekStartCfk = hasCfk ? cfkStartRow.cfk ?? 0 : null;
    const weekStartVva = vvaStartRow.vva ?? 0;
    const weekStartPensioen = hasPension ? firstRow.pensioen ?? 0 : null;
    const weekStartNextGen = hasNextGeneration ? nextGenStartRow.nextgen ?? 0 : null;
    return Array.from({ length: 7 }, (_, index) => ({
      day: index + 1,
      cfk: weekStartCfk,
      vva: weekStartVva,
      pensioen: weekStartPensioen,
      nextgen: weekStartNextGen
    }));
  }, [careerStartAge, lifelineCfkGraphData, hasCfk, hasPension, hasNextGeneration, startAge, startAge3]);
  const lifelineVisiblePhases = useMemo(() => {
    if (lifelineZoomMode === "week") {
      return [];
    }
    if (lifelineZoomMode === "career") {
      return lifelinePhases.filter((phase) => phase.key === "career" && phase.end > phase.start);
    }
    return lifelinePhases.filter(
      (phase) =>
        phase.end > phase.start &&
        (
          phase.key === "career" ||
          (phase.key === "cfk" && hasCfk) ||
          (phase.key === "pension" && hasPension) ||
          (phase.key === "aow" && hasAowIncome)
        )
    );
  }, [hasAowIncome, hasCfk, hasPension, lifelinePhases, lifelineZoomMode]);
  const lifelinePhaseBoundaries = useMemo(() => {
    if (lifelineZoomMode === "week") {
      return [];
    }
    if (lifelineZoomMode === "career") {
      return [careerStartAge, careerEndAge];
    }
    const markers = [careerStartAge, careerEndAge];
    if (hasCfk) {
      markers.push(cfkStartAge, lifeline.cfkPayoutEndAge);
    }
    if (hasPension) {
      markers.push(aowAge, aowAge + lifeline.pensionPayoutYears);
    }
    return Array.from(new Set(markers)).sort((a, b) => a - b);
  }, [
    aowAge,
    careerEndAge,
    careerStartAge,
    cfkStartAge,
    hasCfk,
    hasPension,
    lifeline.cfkPayoutEndAge,
    lifeline.pensionPayoutYears,
    lifelineZoomMode
  ]);
  const lifelineChartView = useMemo(() => {
    if (lifelineZoomMode === "week") {
      const dayLabels = {
        1: "maandag",
        2: "dinsdag",
        3: "woensdag",
        4: "donderdag",
        5: "vrijdag",
        6: "zaterdag",
        7: "zondag"
      };
      const maxWeekValue = Math.max(
        ...lifelineWeekGraphData.map((row) => Math.max(row.cfk || 0, row.vva || 0, row.pensioen || 0, row.nextgen || 0)),
        0
      );
      const weekMarkerTopValue = maxWeekValue > 0 ? maxWeekValue * 0.72 : 2.3;
      return {
        data: lifelineWeekGraphData,
        xDataKey: "day",
        xDomain: [1, 7],
        xTicks: [1, 2, 3, 4, 5, 6, 7],
        xTickFormatter: (value) => dayLabels[value] ?? `${value}`,
        showWeekNote: true,
        weekMarkerTopValue
      };
    }
    if (lifelineZoomMode === "career") {
      const data = lifelineCfkGraphData.filter((row) => row.age >= careerStartAge && row.age <= careerEndAge);
      const xTicks = [];
      for (let age = careerStartAge; age <= careerEndAge; age += 1) {
        xTicks.push(age);
      }
      if (xTicks[xTicks.length - 1] !== careerEndAge) {
        xTicks.push(careerEndAge);
      }
      return {
        data,
        xDataKey: "age",
        xDomain: [careerStartAge, careerEndAge],
        xTicks,
        xTickFormatter: undefined,
        showWeekNote: false,
        weekMarkerTopValue: 0
      };
    }
    return {
      data: lifelineCfkGraphData,
      xDataKey: "age",
      xDomain: [timelineStartAge, lifelineFullMaxAge],
      xTicks: lifelineFullTicks,
      xTickFormatter: undefined,
      showWeekNote: false,
      weekMarkerTopValue: 0
    };
  }, [
    careerEndAge,
    careerStartAge,
    lifeline.maxAge,
    lifelineCfkGraphData,
    lifelineFullMaxAge,
    lifelineFullTicks,
    lifelineTicks,
    lifelineWeekGraphData,
    lifelineZoomMode,
    timelineStartAge
  ]);
  const lifelineCareerStartMarkerLeft = useMemo(() => {
    if (lifelineZoomMode !== "full" || !lifelineChartSize.width) {
      return null;
    }
    const marginLeft = 0;
    const marginRight = 16;
    const yAxisWidth = 60;
    const [domainStart, domainEnd] = lifelineChartView.xDomain;
    const span = Math.max(1, domainEnd - domainStart);
    const plotWidth = lifelineChartSize.width - marginLeft - marginRight - yAxisWidth;
    if (plotWidth <= 0) {
      return null;
    }
    const ratio = (careerStartAge - domainStart) / span;
    return marginLeft + yAxisWidth + Math.max(0, Math.min(1, ratio)) * plotWidth;
  }, [careerStartAge, lifelineChartSize.width, lifelineChartView.xDomain, lifelineZoomMode]);

  const lifelineCareerEndMarkerLeft = useMemo(() => {
    if (lifelineZoomMode !== "full" || !lifelineChartSize.width) {
      return null;
    }
    const marginLeft = 0;
    const marginRight = 16;
    const yAxisWidth = 60;
    const [domainStart, domainEnd] = lifelineChartView.xDomain;
    const span = Math.max(1, domainEnd - domainStart);
    const plotWidth = lifelineChartSize.width - marginLeft - marginRight - yAxisWidth;
    if (plotWidth <= 0) {
      return null;
    }
    const ratio = (careerEndAge - domainStart) / span;
    return marginLeft + yAxisWidth + Math.max(0, Math.min(1, ratio)) * plotWidth;
  }, [careerEndAge, lifelineChartSize.width, lifelineChartView.xDomain, lifelineZoomMode]);

  useEffect(() => {
    if (!isDraggingCareerEndAge && !isDraggingCareerStartAge) {
      return undefined;
    }

    const handleMouseMove = (event) => {
      if (!lifelineChartContainerRef.current || lifelineZoomMode !== "full") {
        return;
      }
      const rect = lifelineChartContainerRef.current.getBoundingClientRect();
      const marginLeft = 0;
      const marginRight = 16;
      const yAxisWidth = 60;
      const plotLeft = rect.left + marginLeft + yAxisWidth;
      const plotWidth = rect.width - marginLeft - marginRight - yAxisWidth;
      if (plotWidth <= 0) {
        return;
      }

      const rawX = Math.min(plotLeft + plotWidth, Math.max(plotLeft, event.clientX));
      const ratio = (rawX - plotLeft) / plotWidth;
      const [domainStart, domainEnd] = lifelineChartView.xDomain;
      const rawAge = Math.round(domainStart + ratio * (domainEnd - domainStart));
      if (isDraggingCareerStartAge) {
        const minCareerStart = 18;
        const maxCareerStart = Math.max(minCareerStart, careerEndAge - 1);
        const nextCareerStart = Math.min(maxCareerStart, Math.max(minCareerStart, rawAge));
        setCareerPhaseStartAge(nextCareerStart);
      } else {
        const minCareerEnd = careerStartAge + 1;
        const maxCareerEnd = 50;
        const nextCareerEnd = Math.min(maxCareerEnd, Math.max(minCareerEnd, rawAge));
        setCareerEndAge(nextCareerEnd);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingCareerStartAge(false);
      setIsDraggingCareerEndAge(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    careerEndAge,
    careerStartAge,
    isDraggingCareerEndAge,
    isDraggingCareerStartAge,
    lifelineChartView.xDomain,
    lifelineZoomMode
  ]);
  const hoveredIncomePoint = hoveredIncomeIndex != null ? lifeline.incomeData[hoveredIncomeIndex] : null;
  const incomeTooltipAnchor = useMemo(() => {
    if (!hoveredIncomePoint || !incomeChartSize.width || !incomeChartSize.height || lifeline.incomeData.length === 0) {
      return null;
    }

    const margin = { top: 10, right: 16, left: 0, bottom: 4 };
    const yAxisWidth = 60;
    const plotWidth = incomeChartSize.width - margin.left - margin.right - yAxisWidth;
    const plotHeight = incomeChartSize.height - margin.top - margin.bottom;
    if (plotWidth <= 0 || plotHeight <= 0) {
      return null;
    }

    const step = plotWidth / lifeline.incomeData.length;
    const left = margin.left + yAxisWidth + step * hoveredIncomeIndex + step / 2;
    const maxTotal = Math.max(
      ...lifeline.incomeData.map((row) => (row.aow || 0) + (row.cfk || 0) + (row.vrij || 0) + (row.pensioen || 0)),
      1
    );
    const total =
      (hoveredIncomePoint.aow || 0) +
      (hoveredIncomePoint.cfk || 0) +
      (hoveredIncomePoint.vrij || 0) +
      (hoveredIncomePoint.pensioen || 0);
    const top = margin.top + (1 - total / maxTotal) * plotHeight;

    return { left, top };
  }, [hoveredIncomePoint, incomeChartSize.width, incomeChartSize.height, lifeline.incomeData, hoveredIncomeIndex]);
  const hoveredPotPoint = hoveredPotIndex != null ? lifeline.potData[hoveredPotIndex] : null;
  const potTooltipAnchor = useMemo(() => {
    if (!hoveredPotPoint || !potChartSize.width || !potChartSize.height || lifeline.potData.length === 0) {
      return null;
    }

    const margin = { top: 10, right: 16, left: 0, bottom: 4 };
    const yAxisWidth = 60;
    const plotWidth = potChartSize.width - margin.left - margin.right - yAxisWidth;
    const plotHeight = potChartSize.height - margin.top - margin.bottom;
    if (plotWidth <= 0 || plotHeight <= 0) {
      return null;
    }

    const step = plotWidth / lifeline.potData.length;
    const left = margin.left + yAxisWidth + step * hoveredPotIndex + step / 2;
    const maxTotal = Math.max(
      ...lifeline.potData.map((row) => (row.cfk || 0) + (row.vrij || 0) + (row.pensioen || 0) + (row.nextgen || 0)),
      1
    );
    const total =
      (hoveredPotPoint.cfk || 0) +
      (hoveredPotPoint.vrij || 0) +
      (hoveredPotPoint.pensioen || 0) +
      (hoveredPotPoint.nextgen || 0);
    const top = margin.top + (1 - total / maxTotal) * plotHeight;

    return { left, top };
  }, [hoveredPotPoint, potChartSize.width, potChartSize.height, lifeline.potData, hoveredPotIndex]);

  const freeWealthExpectedEndResult = lifelineCfkGraphData.reduce((maxValue, row) => {
    if (row.vva == null) {
      return maxValue;
    }
    return Math.max(maxValue, row.vva);
  }, 0);
  const cfkExpectedEndResult = lifelineCfkGraphData.reduce((maxValue, row) => {
    if (row.cfk == null) {
      return maxValue;
    }
    return Math.max(maxValue, row.cfk);
  }, 0);
  const hasFreeWealth = lifeline.potData.some((row) => (row.vrij || 0) > 0);
  const pensionExpectedEndResult = lifeline.pensionCapitalAtAow ?? 0;
  const nextGenerationExpectedEndResult = finalBalance3;
  const isLifelineFocusMode = Boolean(activeScenarioBandKey);
  const showLifelineCfkLine = hasCfk && (!isLifelineFocusMode || activeScenarioBandKey === "cfk");
  const showLifelineVvaLine = hasFreeWealth && (!isLifelineFocusMode || activeScenarioBandKey === "vva");
  const showLifelinePensioenLine = hasPension && (!isLifelineFocusMode || activeScenarioBandKey === "pensioen");
  const showLifelineNextGenLine =
    hasNextGeneration && (!isLifelineFocusMode || activeScenarioBandKey === "nextgen");
  const incomeCareerPhaseStart = Math.max(careerStartAge, timelineStartAge);
  const incomeCareerPhaseEnd = Math.min(careerEndAge, lifeline.maxAge);
  const hasIncomeCareerPhase = incomeCareerPhaseEnd > incomeCareerPhaseStart;
  const getLifelinePhaseLabelLeft = (phase, domainStart, domainEnd) => {
    if (!lifelineChartSize.width) {
      return "50%";
    }
    const marginLeft = 0;
    const marginRight = 16;
    const yAxisWidth = 60;
    const span = Math.max(1, domainEnd - domainStart);
    const plotWidth = lifelineChartSize.width - marginLeft - marginRight - yAxisWidth;
    const centerAge = (phase.start + phase.end) / 2;
    const ratio = (centerAge - domainStart) / span;
    const x = marginLeft + yAxisWidth + Math.max(0, Math.min(1, ratio)) * Math.max(0, plotWidth);
    return `${x}px`;
  };
  const getIncomeCareerLabelLeft = () => {
    if (!incomeChartSize.width) {
      return "50%";
    }
    const marginLeft = 0;
    const marginRight = 16;
    const yAxisWidth = 60;
    const span = Math.max(1, lifeline.maxAge - timelineStartAge);
    const plotWidth = incomeChartSize.width - marginLeft - marginRight - yAxisWidth;
    const centerAge = (incomeCareerPhaseStart + incomeCareerPhaseEnd) / 2;
    const ratio = (centerAge - timelineStartAge) / span;
    const x = marginLeft + yAxisWidth + Math.max(0, Math.min(1, ratio)) * Math.max(0, plotWidth);
    return `${x}px`;
  };

  const getCalculatorModel = (calculatorIndex) => {
    if (calculatorIndex === 0) {
      return {
        startAmount,
        setStartAmount,
        startAge,
        setStartAge,
        childAge: 1,
        setChildAge: () => {},
        phase1MonthlyDeposit,
        setPhase1MonthlyDeposit,
        phase1Years,
        setPhase1Years,
        isCalculatorExpanded,
        setIsCalculatorExpanded,
        investmentHorizon,
        setInvestmentHorizon,
        phase2MonthlyDeposit,
        setPhase2MonthlyDeposit,
        phase2EndYear,
        setPhase2EndYear,
        phase3MonthlyDeposit,
        setPhase3MonthlyDeposit,
        phase3EndYear,
        setPhase3EndYear,
        startDepositsInYear2,
        setStartDepositsInYear2,
        oneTimeExtras,
        updateOneTimeExtra,
        profile,
        setProfile,
        finalBalanceCurrent: finalBalance,
        calculationDataCurrent: calculationData,
        chartContainerRefCurrent: chartContainerRef,
        hoveredPointCurrent: hoveredPoint,
        tooltipAnchorCurrent: tooltipAnchor,
        setHoveredIndexCurrent: setHoveredIndex,
        barYearTicksCurrent: barYearTicks,
        worstCaseBalanceCurrent: worstCaseBalance,
        bestCaseBalanceCurrent: bestCaseBalance
      };
    }

    if (calculatorIndex === 1) {
      return {
        startAmount: startAmount2,
        setStartAmount: setStartAmount2,
        startAge: startAge2,
        setStartAge: setStartAge2,
        childAge: 1,
        setChildAge: () => {},
        phase1MonthlyDeposit: phase1MonthlyDeposit2,
        setPhase1MonthlyDeposit: setPhase1MonthlyDeposit2,
        phase1Years: phase1Years2,
        setPhase1Years: setPhase1Years2,
        isCalculatorExpanded: isCalculatorExpanded2,
        setIsCalculatorExpanded: setIsCalculatorExpanded2,
        investmentHorizon: investmentHorizon2,
        setInvestmentHorizon: setInvestmentHorizon2,
        phase2MonthlyDeposit: phase2MonthlyDeposit2,
        setPhase2MonthlyDeposit: setPhase2MonthlyDeposit2,
        phase2EndYear: phase2EndYear2,
        setPhase2EndYear: setPhase2EndYear2,
        phase3MonthlyDeposit: phase3MonthlyDeposit2,
        setPhase3MonthlyDeposit: setPhase3MonthlyDeposit2,
        phase3EndYear: phase3EndYear2,
        setPhase3EndYear: setPhase3EndYear2,
        startDepositsInYear2: startDepositsInYear22,
        setStartDepositsInYear2: setStartDepositsInYear22,
        oneTimeExtras: oneTimeExtras2,
        updateOneTimeExtra: updateOneTimeExtra2,
        profile: profile2,
        setProfile: setProfile2,
        finalBalanceCurrent: finalBalance2,
        calculationDataCurrent: calculationData2,
        chartContainerRefCurrent: chartContainerRef2,
        hoveredPointCurrent: hoveredPoint2,
        tooltipAnchorCurrent: tooltipAnchor2,
        setHoveredIndexCurrent: setHoveredIndex2,
        barYearTicksCurrent: barYearTicks2,
        worstCaseBalanceCurrent: worstCaseBalance2,
        bestCaseBalanceCurrent: bestCaseBalance2
      };
    }

    return {
      startAmount: startAmount3,
      setStartAmount: setStartAmount3,
      startAge: startAge3,
      setStartAge: setStartAge3,
      childAge: childAge3,
      setChildAge: setChildAge3,
      phase1MonthlyDeposit: phase1MonthlyDeposit3,
      setPhase1MonthlyDeposit: setPhase1MonthlyDeposit3,
      phase1Years: phase1Years3,
      setPhase1Years: setPhase1Years3,
      isCalculatorExpanded: isCalculatorExpanded3,
      setIsCalculatorExpanded: setIsCalculatorExpanded3,
      investmentHorizon: investmentHorizon3,
      setInvestmentHorizon: setInvestmentHorizon3,
      phase2MonthlyDeposit: phase2MonthlyDeposit3,
      setPhase2MonthlyDeposit: setPhase2MonthlyDeposit3,
      phase2EndYear: phase2EndYear3,
      setPhase2EndYear: setPhase2EndYear3,
      phase3MonthlyDeposit: phase3MonthlyDeposit3,
      setPhase3MonthlyDeposit: setPhase3MonthlyDeposit3,
      phase3EndYear: phase3EndYear3,
      setPhase3EndYear: setPhase3EndYear3,
      startDepositsInYear2: startDepositsInYear23,
      setStartDepositsInYear2: setStartDepositsInYear23,
      oneTimeExtras: oneTimeExtras3,
      updateOneTimeExtra: updateOneTimeExtra3,
      profile: profile3,
      setProfile: setProfile3,
      finalBalanceCurrent: finalBalance3,
      calculationDataCurrent: calculationData3,
      chartContainerRefCurrent: chartContainerRef3,
      hoveredPointCurrent: hoveredPoint3,
      tooltipAnchorCurrent: tooltipAnchor3,
      setHoveredIndexCurrent: setHoveredIndex3,
      barYearTicksCurrent: barYearTicks3,
      worstCaseBalanceCurrent: worstCaseBalance3,
      bestCaseBalanceCurrent: bestCaseBalance3
    };
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#0d2a28",
        padding: "24px 0",
        fontFamily:
          'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "24px",
          backgroundColor: "#F7F5E9",
          display: "flex",
          flexDirection: "column",
          fontFamily:
            'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
      {[0, 1, 2].map((calculatorIndex) => {
        const isPrimary = calculatorIndex === 0;
        const model = getCalculatorModel(calculatorIndex);

        const {
          startAmount,
          setStartAmount,
          startAge,
          setStartAge,
          childAge,
          setChildAge,
          phase1MonthlyDeposit,
          setPhase1MonthlyDeposit,
          phase1Years,
          setPhase1Years,
          isCalculatorExpanded,
          setIsCalculatorExpanded,
          investmentHorizon,
          setInvestmentHorizon,
          phase2MonthlyDeposit,
          setPhase2MonthlyDeposit,
          phase2EndYear,
          setPhase2EndYear,
          phase3MonthlyDeposit,
          setPhase3MonthlyDeposit,
          phase3EndYear,
          setPhase3EndYear,
          startDepositsInYear2,
          setStartDepositsInYear2,
          oneTimeExtras,
          updateOneTimeExtra,
          profile,
          setProfile,
          finalBalanceCurrent,
          calculationDataCurrent,
          chartContainerRefCurrent,
          hoveredPointCurrent,
          tooltipAnchorCurrent,
          setHoveredIndexCurrent,
          barYearTicksCurrent,
          worstCaseBalanceCurrent,
          bestCaseBalanceCurrent
        } = model;
        const isNextGeneration = calculatorIndex === 2;
        const startAmountMax = isNextGeneration ? 6500 : 1000000;
        const startAmountFill = startAmountMax === 0 ? 0 : (startAmount / startAmountMax) * 100;
        const phase2MinYear = phase2MonthlyDeposit > 0 || phase3MonthlyDeposit > 0 ? phase1Years : 0;
        const phase2FillPercentage =
          investmentHorizon - phase2MinYear === 0
            ? 0
            : ((phase2EndYear - phase2MinYear) / (investmentHorizon - phase2MinYear)) * 100;
        const phase3MinYear = phase3MonthlyDeposit > 0 ? phase2EndYear : 0;
        const phase3FillPercentage =
          investmentHorizon - phase3MinYear === 0
            ? 0
            : ((phase3EndYear - phase3MinYear) / (investmentHorizon - phase3MinYear)) * 100;

        return (
      <div
        key={`calculator-${calculatorIndex}`}
        style={{
          marginTop: calculatorIndex === 0 ? "0" : "32px",
          backgroundColor: "#f5f2e9",
          borderRadius: "10px",
          border: "1px solid #d6d1c2",
          padding: "24px"
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "32px",
            flexDirection: isDesktop ? "row" : "column",
            alignItems: "center",
            marginBottom: isDesktop ? "18px" : "14px"
          }}
        >
          <div style={{ width: isDesktop ? "40%" : "100%", display: "flex", justifyContent: "center" }}>
            <div
              style={{
                fontSize: isDesktop ? "42px" : "30px",
                lineHeight: 1.05,
                fontWeight: 700,
                color: "#0d2a28",
                textAlign: "center"
              }}
            >
              {calculatorIndex === 0
                ? "Vrij Vermogen"
                : calculatorIndex === 1
                  ? "Pensioen vermogen"
                  : "Next Generation vermogen"}
            </div>
          </div>
          <div style={{ width: isDesktop ? "60%" : "100%", display: "flex", justifyContent: "center" }}>
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
                {formatCurrency(finalBalanceCurrent)}
                <span style={{ fontSize: "20px", verticalAlign: "top" }}>*</span>
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "32px",
            flexDirection: isDesktop ? "row" : "column",
            alignItems: "flex-start"
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
                max={startAmountMax}
                step={isNextGeneration ? 100 : 1000}
                value={startAmount}
                onChange={(e) => setStartAmount(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #D2BB5D 0%, #D2BB5D ${startAmountFill}%, #E5E7EB ${startAmountFill}%, #E5E7EB 100%)`,
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
                <span>{isNextGeneration ? "€6.500" : "€1.000.000"}</span>
              </div>
            </div>
          </div>

          {/* Start Age */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}
            >
              <label style={{ fontSize: "18px", fontWeight: "500", color: "#111827" }}>Startleeftijd</label>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>{startAge} jaar</span>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="range"
                min="18"
                max="50"
                step="1"
                value={startAge}
                onChange={(e) => setStartAge(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #D2BB5D 0%, #D2BB5D ${((startAge - 18) / 32) * 100}%, #E5E7EB ${((startAge - 18) / 32) * 100}%, #E5E7EB 100%)`,
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
                <span>18</span>
                <span>50</span>
              </div>
            </div>
          </div>

          {isNextGeneration && (
            <div style={{ marginBottom: "32px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px"
                }}
              >
                <label style={{ fontSize: "18px", fontWeight: "500", color: "#111827" }}>Leeftijd kind</label>
                <span style={{ fontSize: "20px", fontWeight: "bold" }}>{childAge} jaar</span>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={childAge}
                  onChange={(e) => setChildAge(Number(e.target.value))}
                  style={{
                    width: "100%",
                    height: "8px",
                    borderRadius: "4px",
                    background: `linear-gradient(to right, #D2BB5D 0%, #D2BB5D ${((childAge - 1) / 14) * 100}%, #E5E7EB ${((childAge - 1) / 14) * 100}%, #E5E7EB 100%)`,
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
                  <span>15 jaar</span>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Deposit - Phase 1 */}
          {!isNextGeneration && <div style={{ marginBottom: "32px" }}>
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
          </div>}

          {!isNextGeneration && (
          <>
          <div
            role="button"
            tabIndex={0}
            aria-expanded={isCalculatorExpanded}
            onClick={() => setIsCalculatorExpanded((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsCalculatorExpanded((prev) => !prev);
              }
            }}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              cursor: "pointer",
              userSelect: "none",
              border: "1px solid #d8d2bf",
              borderRadius: "8px",
              padding: "10px 12px",
              backgroundColor: "#fbf9f1"
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}>Fase 1 tot jaar</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px", fontWeight: "700" }}>{phase1Years} jaar</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "999px",
                  border: "1px solid #d8d2bf",
                  backgroundColor: "#ffffff",
                  transform: isCalculatorExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 200ms ease"
                }}
              >
                <svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
                  <path d="M1 1l5 5 5-5" fill="none" stroke="#111827" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </span>
            </div>
          </div>

          {/* Phase 1 End Year */}
          <div style={{ marginBottom: "32px" }}>
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

          <div style={{ display: "grid", gridTemplateRows: isCalculatorExpanded ? "1fr" : "0fr", transition: "grid-template-rows 320ms ease" }}>
            <div
              style={{
                overflow: "hidden",
                opacity: isCalculatorExpanded ? 1 : 0,
                transition: "opacity 200ms ease",
                pointerEvents: isCalculatorExpanded ? "auto" : "none"
              }}
            >
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
                min={phase2MinYear}
                max={investmentHorizon}
                step="1"
                value={phase2EndYear}
                onChange={(e) => setPhase2EndYear(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #D2BB5D 0%, #D2BB5D ${phase2FillPercentage}%, #E5E7EB ${phase2FillPercentage}%, #E5E7EB 100%)`,
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
                <span>{phase2MinYear} jaar</span>
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
                min={phase3MinYear}
                max={investmentHorizon}
                step="1"
                value={phase3EndYear}
                onChange={(e) => setPhase3EndYear(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #D2BB5D 0%, #D2BB5D ${phase3FillPercentage}%, #E5E7EB ${phase3FillPercentage}%, #E5E7EB 100%)`,
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
                <span>{phase3MinYear} jaar</span>
                <span>{investmentHorizon} jaar</span>
              </div>
            </div>
          </div>
          </div>

          </div>
          </>
          )}

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
                {isNextGeneration ? "Looptijd tot 18 jaar" : "Beleggingshorizon"}
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
                onChange={(e) => {
                  if (!isNextGeneration) {
                    setInvestmentHorizon(Number(e.target.value));
                  }
                }}
                disabled={isNextGeneration}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #D2BB5D 0%, #D2BB5D ${((investmentHorizon - 1) / 49) * 100}%, #E5E7EB ${((investmentHorizon - 1) / 49) * 100}%, #E5E7EB 100%)`,
                  outline: "none",
                  appearance: "none",
                  cursor: isNextGeneration ? "not-allowed" : "pointer",
                  opacity: isNextGeneration ? 0.75 : 1
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
                <span>{isNextGeneration ? `${childAge} jaar` : "1 jaar"}</span>
                <span>{isNextGeneration ? "18 jaar" : "50 jaar"}</span>
              </div>
            </div>
          </div>

          {!isNextGeneration && <div style={{ marginBottom: "24px" }}>
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
          </div>}

          {/* One-time extra deposit */}
          {!isNextGeneration && <div style={{ marginBottom: "28px", padding: "12px", border: "1px solid #D2BB5D", borderRadius: "8px" }}>
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
          </div>}

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
            <div style={{ height: "450px", position: "relative" }} ref={chartContainerRefCurrent}>
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
              {hoveredPointCurrent && tooltipAnchorCurrent ? (
                <AnchoredBarTooltip
                  point={hoveredPointCurrent}
                  label={hoveredPointCurrent.year}
                  left={tooltipAnchorCurrent.left}
                  top={tooltipAnchorCurrent.top}
                  formatCurrency={formatCurrency}
                />
              ) : null}
              <div style={{ position: "relative", zIndex: 1, height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={calculationDataCurrent}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                    onMouseLeave={() => setHoveredIndexCurrent(null)}
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
                      ticks={barYearTicksCurrent}
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
                      onMouseOver={(_, index) => setHoveredIndexCurrent(index)}
                    />
                    <Bar
                      dataKey="deposits"
                      stackId="stack"
                      fill="url(#darkGradient)"
                      radius={[0, 0, 0, 0]}
                      onMouseOver={(_, index) => setHoveredIndexCurrent(index)}
                    />
                    <Bar
                      dataKey="interest"
                      stackId="stack"
                      fill="url(#goldGradient)"
                      radius={[4, 4, 0, 0]}
                      onMouseOver={(_, index) => setHoveredIndexCurrent(index)}
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
              resultaat waarschijnlijk tussen {formatCurrency(worstCaseBalanceCurrent)} en{" "}
              {formatCurrency(bestCaseBalanceCurrent)} zal liggen. Voor details en achtergronden zie onze FAQ
              <br />
              **Deze rekentool laat de te verwachten netto € resultaten zien, dus na aftrek van de kosten.
            </div>
          </div>
        </div>
      </div>
      {isPrimary && isCalculatorExpanded && (
        <section
          style={{
            marginTop: "20px",
            background: "#0d2a28",
            color: "#eaf2ef",
            borderRadius: "8px",
            border: "1px solid rgba(210,187,93,0.35)",
            padding: "18px",
            boxSizing: "border-box",
            maxWidth: "100%"
          }}
        >
          <h3 style={{ margin: 0, fontSize: "28px", lineHeight: "1.1" }}>
            De cijfers <em>spreken</em>
          </h3>
          <p style={{ marginTop: "8px", marginBottom: "14px", fontSize: "14px", lineHeight: "1.45", color: "#d2ddd8" }}>
            Deze grafiek laat zien hoe je portefeuille zou zijn gegroeid wanneer je de afgelopen jaren belegd zou
            hebben zoals Animo dat nu mogelijk maakt.
          </p>
          <div style={{ marginTop: "6px", height: "320px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={showcaseGraph.data} margin={{ top: 16, right: 26, left: 18, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.12)" />
                <XAxis
                  type="number"
                  dataKey="yearValue"
                  domain={[2017, 2025]}
                  ticks={[2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]}
                  padding={{ left: 6, right: 14 }}
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
      )}
      </div>
        );
      })}

      <section
        style={{
          order: -1,
          marginTop: "0",
          marginBottom: "32px",
          backgroundColor: "#f5f2e9",
          borderRadius: "10px",
          border: "1px solid #d6d1c2",
          padding: "24px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "28px" }}>Levensloop profvoetballer</h2>
          <div style={{ fontSize: "14px", color: "#6B7280" }}>
            Startleeftijd {startAge} · AOW {aowAge}
          </div>
        </div>

        <div style={{ marginTop: "16px", border: "1px solid #ded8c7", borderRadius: "8px", background: "#fbf9f1", padding: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            {[
              { key: "week", label: "Week" },
              { key: "career", label: "Carrière" },
              { key: "full", label: "Volledig" }
            ].map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => setLifelineZoomMode(mode.key)}
                style={{
                  border: `1px solid ${subtleOverlayTextColor}`,
                  color: subtleOverlayTextColor,
                  backgroundColor: lifelineZoomMode === mode.key ? "rgba(0,0,0,0.08)" : "transparent",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  fontSize: "11px",
                  lineHeight: 1.2,
                  cursor: "pointer"
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <div ref={lifelineChartContainerRef} style={{ height: "300px", position: "relative" }}>
            {lifelineZoomMode === "full" && lifelineCareerStartMarkerLeft != null && (
              <div
                role="slider"
                aria-label="Start carrièreleeftijd"
                aria-valuemin={18}
                aria-valuemax={Math.max(18, careerEndAge - 1)}
                aria-valuenow={careerStartAge}
                onMouseDown={(event) => {
                  event.preventDefault();
                  setIsDraggingCareerStartAge(true);
                }}
                style={{
                  position: "absolute",
                  left: `${lifelineCareerStartMarkerLeft - 8}px`,
                  top: "18px",
                  bottom: "18px",
                  width: "16px",
                  cursor: "ew-resize",
                  zIndex: 4
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "0",
                    bottom: "0",
                    transform: "translateX(-50%)",
                    borderLeft: "2px dashed rgba(17,24,39,0.35)"
                  }}
                />
              </div>
            )}
            {lifelineZoomMode === "full" && lifelineCareerEndMarkerLeft != null && (
              <div
                role="slider"
                aria-label="Einde carrièreleeftijd"
                aria-valuemin={careerStartAge + 1}
                aria-valuemax={50}
                aria-valuenow={careerEndAge}
                onMouseDown={(event) => {
                  event.preventDefault();
                  setIsDraggingCareerEndAge(true);
                }}
                style={{
                  position: "absolute",
                  left: `${lifelineCareerEndMarkerLeft - 8}px`,
                  top: "18px",
                  bottom: "18px",
                  width: "16px",
                  cursor: "ew-resize",
                  zIndex: 4
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "0",
                    bottom: "0",
                    transform: "translateX(-50%)",
                    borderLeft: "2px dashed rgba(17,24,39,0.35)"
                  }}
                />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={lifelineChartView.data}
                margin={{ top: 18, right: 16, left: 0, bottom: 18 }}
                onMouseLeave={() => setHoveredLifelineSeriesKey(null)}
              >
                <CartesianGrid stroke="#e5e2d8" vertical={false} />
                {lifelineZoomMode !== "week" && hasAowIncome && (() => {
                  const visibleStart = Math.max(aowAge, lifelineChartView.xDomain[0]);
                  const visibleEnd = Math.min(lifelineChartView.xDomain[1], lifeline.maxAge);
                  return visibleEnd > visibleStart ? (
                    <ReferenceArea
                      x1={visibleStart}
                      x2={visibleEnd}
                      y1={0}
                      y2={lifeline.aowAnnualIncome}
                      fill="#c0c0c0"
                      fillOpacity={0.32}
                      strokeOpacity={0}
                    />
                  ) : null;
                })()}
                {lifelineVisiblePhases.map((phase) => {
                  const visibleStart = Math.max(phase.start, lifelineChartView.xDomain[0]);
                  const visibleEnd = Math.min(phase.end, lifelineChartView.xDomain[1]);
                  return visibleEnd > visibleStart ? (
                    <ReferenceArea
                      key={`phase-${phase.key}`}
                      x1={visibleStart}
                      x2={visibleEnd}
                      fill={phase.color}
                      strokeOpacity={0}
                    />
                  ) : null;
                })}
                {lifelineZoomMode !== "week" &&
                  lifelineFreeWealthPayoutAreas.map((range, idx) => {
                    const visibleStart = Math.max(range.start, lifelineChartView.xDomain[0]);
                    const visibleEnd = Math.min(range.end, lifelineChartView.xDomain[1]);
                    return visibleEnd > visibleStart ? (
                      <ReferenceArea
                        key={`vrij-payout-area-${idx}`}
                        x1={visibleStart}
                        x2={visibleEnd}
                        fill="rgba(210,187,93,0.13)"
                        strokeOpacity={0}
                      />
                    ) : null;
                  })}
                {lifelinePhaseBoundaries.map((marker) => (
                  <ReferenceLine key={`marker-${marker}`} x={marker} stroke="#8a8a8a" strokeDasharray="3 4" />
                ))}
                {lifelineChartView.showWeekNote && (
                  <>
                    <ReferenceLine
                      segment={[
                        { x: 6, y: 0 },
                        { x: 6, y: lifelineChartView.weekMarkerTopValue }
                      ]}
                      stroke="#111827"
                      strokeWidth={2}
                    />
                    <ReferenceDot
                      x={6}
                      y={lifelineChartView.weekMarkerTopValue}
                      r={0}
                      ifOverflow="extendDomain"
                      label={{
                        value: "Eerstvolgende wedstrijd",
                        position: "top",
                        fill: "#111827",
                        fontSize: 14,
                        fontWeight: 700
                      }}
                    />
                  </>
                )}
                <XAxis
                  type="number"
                  dataKey={lifelineChartView.xDataKey}
                  domain={lifelineChartView.xDomain}
                  ticks={lifelineChartView.xTicks}
                  padding={lifelineZoomMode === "week" ? { left: 0, right: 14 } : undefined}
                  tick={{ fontSize: 11, fill: "#4b5563" }}
                  axisLine={{ stroke: "#d8d2bf" }}
                  tickLine={false}
                  tickFormatter={lifelineChartView.xTickFormatter}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#4b5563" }}
                  tickFormatter={formatCurrencyShort}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  cursor={{ stroke: "#9ca3af", strokeDasharray: "3 4" }}
                  content={
                    <LifelineHoverTooltip
                      formatCurrency={formatCurrency}
                      zoomMode={lifelineZoomMode}
                      activeSeriesKey={hoveredLifelineSeriesKey}
                      focusedSeriesKey={activeScenarioBandKey}
                    />
                  }
                />
                {lifelineZoomMode === "full" && showLifelineVvaLine && activeScenarioBandKey === "vva" && (
                  <>
                    <Area type="monotone" dataKey="vvaLow" stackId="vvaBand" stroke="none" fillOpacity={0} />
                    <Area
                      type="monotone"
                      dataKey="vvaBand"
                      stackId="vvaBand"
                      stroke="none"
                      fill="#d2bb5d"
                      fillOpacity={0.16}
                    />
                  </>
                )}
                {lifelineZoomMode === "full" && showLifelinePensioenLine && activeScenarioBandKey === "pensioen" && (
                  <>
                    <Area type="monotone" dataKey="pensioenLow" stackId="pensioenBand" stroke="none" fillOpacity={0} />
                    <Area
                      type="monotone"
                      dataKey="pensioenBand"
                      stackId="pensioenBand"
                      stroke="none"
                      fill="#6672a8"
                      fillOpacity={0.14}
                    />
                  </>
                )}
                {showLifelineCfkLine && (
                  <Line
                    type="monotone"
                    dataKey="cfk"
                    stroke="#0d2a28"
                    strokeWidth={3}
                    dot={false}
                    onMouseMove={() => setHoveredLifelineSeriesKey("cfk")}
                  />
                )}
                {showLifelineVvaLine && (
                  <Line
                    type="monotone"
                    dataKey="vva"
                    stroke="#d2bb5d"
                    strokeWidth={3}
                    dot={false}
                    onMouseMove={() => setHoveredLifelineSeriesKey("vva")}
                  />
                )}
                {showLifelinePensioenLine && (
                  <Line
                    type="monotone"
                    dataKey="pensioen"
                    stroke="#6672a8"
                    strokeWidth={3}
                    dot={false}
                    onMouseMove={() => setHoveredLifelineSeriesKey("pensioen")}
                  />
                )}
                {showLifelineNextGenLine && (
                  <Line
                    type="monotone"
                    dataKey="nextgen"
                    stroke="#ffa07a"
                    strokeWidth={3}
                    dot={false}
                    onMouseMove={() => setHoveredLifelineSeriesKey("nextgen")}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {lifelineVisiblePhases.length > 0 && (
            <div style={{ position: "relative", marginTop: "4px", height: "40px" }}>
              {lifelineVisiblePhases.map((phase) => {
                const rangeLabel = `(${Math.round(phase.start)}-${Math.round(phase.end)})`;
                return (
                  <div
                    key={`label-${phase.key}`}
                    style={{
                      position: "absolute",
                      left: getLifelinePhaseLabelLeft(phase, lifelineChartView.xDomain[0], lifelineChartView.xDomain[1]),
                      transform:
                        phase.key === "aow" && hasPension
                          ? "translate(-50%, 22px)"
                          : "translateX(-50%)",
                      textAlign: "center",
                      fontSize: "13px",
                      color:
                        phase.key === "career"
                          ? "#65c368"
                          : phase.key === "pension"
                            ? "#6672a8"
                            : phase.key === "aow"
                              ? "#8d8d8d"
                              : "#0d2a28",
                      fontWeight: 600,
                      whiteSpace: "nowrap"
                    }}
                  >
                    {phase.key === "cfk" ? (
                      <>
                        <div>CFK uitkering</div>
                        <div style={{ fontSize: "12px", marginTop: "2px" }}>{rangeLabel}</div>
                      </>
                    ) : phase.key === "pension" ? (
                      <>
                        <div>Pensioen uitkering</div>
                        <div style={{ fontSize: "12px", marginTop: "2px" }}>{rangeLabel}</div>
                      </>
                    ) : phase.key === "aow" ? (
                      <>
                        <div>AOW uitkering</div>
                        <div style={{ fontSize: "12px", marginTop: "2px" }}>{rangeLabel}</div>
                      </>
                    ) : (
                      <div>{phase.label} {rangeLabel}</div>
                    )}
                    {phase.key === "career" && <div style={{ fontSize: "12px", marginTop: "2px" }}>Opbouwfase</div>}
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {hasCfk && (
              <button
                type="button"
                onClick={() => setActiveScenarioBandKey((prev) => (prev === "cfk" ? null : "cfk"))}
                style={{
                  border: `1px solid ${subtleOverlayTextColor}`,
                  color: subtleOverlayTextColor,
                  backgroundColor: activeScenarioBandKey === "cfk" ? "rgba(0,0,0,0.08)" : "transparent",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  fontSize: "11px",
                  lineHeight: 1.2,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span style={{ width: "10px", height: "3px", backgroundColor: "#0d2a28", borderRadius: "2px" }} />
                CFK vermogen
              </button>
            )}
            {hasFreeWealth && (
              <button
                type="button"
                onClick={() => setActiveScenarioBandKey((prev) => (prev === "vva" ? null : "vva"))}
                style={{
                  border: `1px solid ${subtleOverlayTextColor}`,
                  color: subtleOverlayTextColor,
                  backgroundColor: activeScenarioBandKey === "vva" ? "rgba(0,0,0,0.08)" : "transparent",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  fontSize: "11px",
                  lineHeight: 1.2,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span style={{ width: "10px", height: "3px", backgroundColor: "#d2bb5d", borderRadius: "2px" }} />
                Vrij Vermogen Animo
              </button>
            )}
            {hasPension && (
              <button
                type="button"
                onClick={() => setActiveScenarioBandKey((prev) => (prev === "pensioen" ? null : "pensioen"))}
                style={{
                  border: `1px solid ${subtleOverlayTextColor}`,
                  color: subtleOverlayTextColor,
                  backgroundColor: activeScenarioBandKey === "pensioen" ? "rgba(0,0,0,0.08)" : "transparent",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  fontSize: "11px",
                  lineHeight: 1.2,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span style={{ width: "10px", height: "3px", backgroundColor: "#6672a8", borderRadius: "2px" }} />
                Pensioen Animo
              </button>
            )}
            {hasAowIncome && (
              <button
                type="button"
                style={{
                  border: `1px solid ${subtleOverlayTextColor}`,
                  color: subtleOverlayTextColor,
                  backgroundColor: "transparent",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  fontSize: "11px",
                  lineHeight: 1.2,
                  cursor: "default",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span style={{ width: "10px", height: "3px", backgroundColor: "#c0c0c0", borderRadius: "2px" }} />
                AOW uitkering
              </button>
            )}
            {hasNextGeneration && (
              <button
                type="button"
                onClick={() => setActiveScenarioBandKey((prev) => (prev === "nextgen" ? null : "nextgen"))}
                style={{
                  border: `1px solid ${subtleOverlayTextColor}`,
                  color: subtleOverlayTextColor,
                  backgroundColor: activeScenarioBandKey === "nextgen" ? "rgba(0,0,0,0.08)" : "transparent",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  fontSize: "11px",
                  lineHeight: 1.2,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span style={{ width: "10px", height: "3px", backgroundColor: "#ffa07a", borderRadius: "2px" }} />
                Next Generation Animo
              </button>
            )}
            <button
              type="button"
              onClick={toggleExamplePreset}
              style={{
                border: `1px solid ${subtleOverlayTextColor}`,
                color: subtleOverlayTextColor,
                backgroundColor: isExamplePresetActive ? "rgba(0,0,0,0.08)" : "transparent",
                borderRadius: "4px",
                padding: "3px 8px",
                fontSize: "11px",
                lineHeight: 1.2,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                marginLeft: "auto"
              }}
            >
              voorbeeld
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: "20px",
            display: "grid",
            gap: "16px",
            gridTemplateColumns: isDesktop ? "repeat(4, minmax(0, 1fr))" : "1fr"
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "8px",
              padding: "12px",
              border: "1px solid #e1dccb"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>
              <span>CFK</span>
              <span style={{ width: "14px", height: "3px", backgroundColor: "#0d2a28", borderRadius: "2px" }} />
            </div>
            <div style={{ fontSize: "12px", color: "#6B7280" }}>Verwacht eindresultaat (bruto - box1)</div>
            <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "6px", marginBottom: "10px" }}>
              {formatCurrency(cfkExpectedEndResult)}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isDesktop ? "minmax(0, 1fr) minmax(0, 110px)" : "1fr",
                gap: "12px",
                alignItems: "end"
              }}
            >
              <div style={{ minWidth: 0 }}>
                <label style={{ fontSize: "12px", color: "#6B7280" }}>CFK waarde</label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", maxWidth: "128px" }}>
                  <span style={{ fontSize: "14px", color: "#111827" }}>€</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatEuroInput(cfkPot)}
                    onChange={(e) => setCfkPot(clampEuro(parseEuroInput(e.target.value), 0, 5000000))}
                    style={{
                      width: "100%",
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
              <div style={{ minWidth: 0 }}>
                <label style={{ fontSize: "12px", color: "#6B7280" }}>Rendement % p/j</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={cfkReturnRate}
                  onChange={(e) => setCfkReturnRate(Number(e.target.value))}
                  style={{
                    width: "100%",
                    maxWidth: "96px",
                    marginTop: "6px",
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
            <div style={{ marginTop: "10px" }}>
              <div style={{ fontSize: "12px", color: "#6B7280" }}>
                Start uitkering: {cfkStartAge} jaar
              </div>
              <label style={{ fontSize: "12px", color: "#6B7280", marginTop: "8px", display: "block" }}>
                Uitkeringsduur (maanden)
              </label>
              <input
                className="cfk-duration-slider"
                type="range"
                min={cfkDurationRange.min}
                max={cfkDurationRange.max}
                step="1"
                value={cfkDurationMonths}
                onChange={(e) => setCfkDurationMonths(Number(e.target.value))}
                style={{
                  width: "100%",
                  marginTop: "6px",
                  height: "6px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #0d2a28 0%, #0d2a28 ${
                    cfkDurationRange.max === cfkDurationRange.min
                      ? 100
                      : ((cfkDurationMonths - cfkDurationRange.min) / (cfkDurationRange.max - cfkDurationRange.min)) * 100
                  }%, #E5E7EB ${
                    cfkDurationRange.max === cfkDurationRange.min
                      ? 100
                      : ((cfkDurationMonths - cfkDurationRange.min) / (cfkDurationRange.max - cfkDurationRange.min)) * 100
                  }%, #E5E7EB 100%)`,
                  outline: "none",
                  appearance: "none",
                  cursor: "pointer"
                }}
              />
              <div style={{ fontSize: "12px", color: "#6B7280", textAlign: "right" }}>{cfkDurationMonths} mnd</div>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: "8px", padding: "12px", border: "1px solid #e1dccb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>
              <span>Vrij Vermogen Animo</span>
              <span style={{ width: "14px", height: "3px", backgroundColor: "#d2bb5d", borderRadius: "2px" }} />
            </div>
            <div style={{ fontSize: "12px", color: "#6B7280" }}>Verwacht eindresultaat (netto - box3)</div>
            <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "6px" }}>
              {formatCurrency(freeWealthExpectedEndResult)}
            </div>
            <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "10px", marginBottom: "6px" }}>Uitkering</div>
            {freeWealthPayouts.map((row, idx) => (
              <div
                key={`free-payout-${idx}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) 30px 44px 30px 44px",
                  gap: "6px",
                  marginTop: idx === 0 ? 0 : "8px",
                  alignItems: "center",
                  width: "92%"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "14px", color: "#111827" }}>€</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatEuroInput(row.amount)}
                    onChange={(e) => updateFreeWealthPayout(idx, "amount", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "5px 7px",
                      border: "1px solid #D2BB5D",
                      borderRadius: "6px",
                      fontSize: "13px",
                      outline: "none",
                      backgroundColor: "#fff"
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#6B7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%"
                  }}
                >
                  van
                </span>
                <input
                  type="number"
                  min={startAge}
                  max="95"
                  value={row.fromAge}
                  onChange={(e) => updateFreeWealthPayout(idx, "fromAge", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "5px 4px",
                    border: "1px solid #D2BB5D",
                    borderRadius: "6px",
                    fontSize: "13px",
                    textAlign: "center",
                    outline: "none",
                    backgroundColor: "#fff"
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    color: "#6B7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%"
                  }}
                >
                  tot
                </span>
                <input
                  type="number"
                  min={row.fromAge}
                  max="95"
                  value={row.toAge}
                  onChange={(e) => updateFreeWealthPayout(idx, "toAge", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "5px 4px",
                    border: "1px solid #D2BB5D",
                    borderRadius: "6px",
                    fontSize: "13px",
                    textAlign: "center",
                    outline: "none",
                    backgroundColor: "#fff"
                  }}
                />
              </div>
            ))}
            <div
              style={{
                marginTop: "10px",
                borderTop: `1px solid ${subtleOverlayTextColor}`,
                width: "92%"
              }}
            />
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "nowrap",
                width: "92%"
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  color: "#6B7280",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer"
                }}
              >
                <span>behouden</span>
                <input
                  type="checkbox"
                  checked={freeWealthSwitchToConservative}
                  onChange={(e) => setFreeWealthSwitchToConservative(e.target.checked)}
                  style={{ width: "14px", height: "14px", accentColor: "#D2BB5D", cursor: "pointer" }}
                />
              </label>
              <label
                style={{
                  marginLeft: "12px",
                  fontSize: "12px",
                  color: "#6B7280",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <span>vanaf jaar</span>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, investmentHorizon)}
                  step="1"
                  value={freeWealthConservativeFromYear}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      return;
                    }
                    const parsed = Number(raw);
                    if (Number.isFinite(parsed)) {
                      const clamped = Math.min(Math.max(1, Math.floor(parsed)), Math.max(1, investmentHorizon));
                      setFreeWealthConservativeFromYear(clamped);
                    }
                  }}
                  style={{
                    width: "44px",
                    padding: "5px 6px",
                    border: "1px solid #D2BB5D",
                    borderRadius: "6px",
                    fontSize: "12px",
                    outline: "none",
                    backgroundColor: "#fff"
                  }}
                />
              </label>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: "8px", padding: "12px", border: "1px solid #e1dccb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>
              <span>Pensioen Animo</span>
              <span style={{ width: "14px", height: "3px", backgroundColor: "#6672a8", borderRadius: "2px" }} />
            </div>
            <div style={{ fontSize: "12px", color: "#6B7280" }}>Verwacht eindresultaat (bruto - box1)</div>
            <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "6px" }}>{formatCurrency(pensionExpectedEndResult)}</div>
            <label style={{ fontSize: "12px", color: "#6B7280", marginTop: "10px", display: "block" }}>
              Rendement (% p/j)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={pensionReturnRate}
              onChange={(e) => setPensionReturnRate(Number(e.target.value))}
              style={{
                width: "50%",
                marginTop: "6px",
                padding: "6px 8px",
                border: "1px solid #D2BB5D",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#fff"
              }}
            />
            <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "10px" }}>
              Start uitkering: {aowAge} jaar
            </div>
            <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "6px" }}>
              Uitkeringsduur: {lifeline.pensionPayoutYears} jaar
            </div>
            <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "6px" }}>
              Jaarlijkse uitkering: {formatCurrency(lifeline.pensionAnnualPayout)}
            </div>
            <div
              style={{
                marginTop: "10px",
                borderTop: `1px solid ${subtleOverlayTextColor}`
              }}
            />
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "nowrap"
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  color: "#6B7280",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer"
                }}
              >
                <span style={{ width: "14px", height: "3px", backgroundColor: "#c0c0c0", borderRadius: "2px" }} />
                <span>AOW</span>
                <input
                  type="checkbox"
                  checked={pensionAowEnabled}
                  onChange={(e) => setPensionAowEnabled(e.target.checked)}
                  style={{ width: "14px", height: "14px", accentColor: "#D2BB5D", cursor: "pointer" }}
                />
              </label>
              <label
                style={{
                  marginLeft: "14px",
                  fontSize: "12px",
                  color: "#6B7280",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <span>jaren in buitenland</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={pensionYearsAbroad}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setPensionYearsAbroad("");
                      return;
                    }
                    const parsed = Number(value);
                    if (Number.isFinite(parsed) && parsed >= 0) {
                      setPensionYearsAbroad(String(Math.floor(parsed)));
                    }
                  }}
                  style={{
                    width: "36px",
                    padding: "5px 6px",
                    border: "1px solid #D2BB5D",
                    borderRadius: "6px",
                    fontSize: "12px",
                    outline: "none",
                    backgroundColor: "#fff"
                  }}
                />
              </label>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: "8px", padding: "12px", border: "1px solid #e1dccb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>
              <span>Next Generation Animo</span>
              <span style={{ width: "14px", height: "3px", backgroundColor: "#ffa07a", borderRadius: "2px" }} />
            </div>
            <div style={{ fontSize: "12px", color: "#6B7280" }}>Verwacht eindresultaat (netto)</div>
            <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "6px" }}>
              {formatCurrency(nextGenerationExpectedEndResult)}
            </div>
            <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "10px" }}>
              Minderjarige rekening: tot 18 jaar
            </div>
            <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "6px" }}>
              o.b.v. jaarlijks belastingvrije schenking
            </div>
          </div>

        </div>

        <div style={{ marginTop: "24px", display: "grid", gap: "20px" }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>Inkomensoverzicht per jaar</div>
            <div ref={incomeChartContainerRef} style={{ height: "220px", position: "relative" }}>
              {hoveredIncomePoint && incomeTooltipAnchor ? (
                <AnchoredIncomeTooltip
                  point={hoveredIncomePoint}
                  label={hoveredIncomePoint.age}
                  left={incomeTooltipAnchor.left}
                  top={incomeTooltipAnchor.top}
                  formatCurrency={formatCurrency}
                />
              ) : null}
              {hasIncomeCareerPhase && (
                <div
                  style={{
                    position: "absolute",
                    left: getIncomeCareerLabelLeft(),
                    top: "39%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "12px",
                    lineHeight: 1.15,
                    color: subtleOverlayTextColor,
                    textAlign: "center",
                    pointerEvents: "none",
                    zIndex: 2
                  }}
                >
                  <div>Inkomsten</div>
                  <div>uit voetbal</div>
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={lifeline.incomeData}
                  margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
                  onMouseLeave={() => setHoveredIncomeIndex(null)}
                >
                  {hasIncomeCareerPhase && (
                    <ReferenceArea
                      x1={incomeCareerPhaseStart}
                      x2={incomeCareerPhaseEnd}
                      fill="rgba(101,195,104,0.18)"
                      strokeOpacity={0}
                    />
                  )}
                  {hasIncomeCareerPhase && (
                    <>
                      <ReferenceLine x={incomeCareerPhaseStart} stroke="#8a8a8a" strokeDasharray="3 4" />
                      <ReferenceLine x={incomeCareerPhaseEnd} stroke="#8a8a8a" strokeDasharray="3 4" />
                    </>
                  )}
                  <XAxis
                    dataKey="age"
                    ticks={lifelineTicks}
                    interval={0}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    tickFormatter={(value) => Math.round(value).toLocaleString("nl-NL")}
                    width={60}
                  />
                  <Bar
                    dataKey="aow"
                    stackId="income"
                    fill="#c0c0c0"
                    onMouseOver={(_, index) => setHoveredIncomeIndex(index)}
                  />
                  <Bar
                    dataKey="pensioen"
                    stackId="income"
                    fill="#6672a8"
                    onMouseOver={(_, index) => setHoveredIncomeIndex(index)}
                  />
                  <Bar dataKey="cfk" stackId="income" fill="#0d2a28" onMouseOver={(_, index) => setHoveredIncomeIndex(index)} />
                  <Bar dataKey="vrij" stackId="income" fill="#d2bb5d" onMouseOver={(_, index) => setHoveredIncomeIndex(index)} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>
              Vermogensoverzicht per jaar
            </div>
            <div ref={potChartContainerRef} style={{ height: "220px", position: "relative" }}>
              {hoveredPotPoint && potTooltipAnchor ? (
                <AnchoredPotTooltip
                  point={hoveredPotPoint}
                  label={hoveredPotPoint.age}
                  left={potTooltipAnchor.left}
                  top={potTooltipAnchor.top}
                  formatCurrency={formatCurrency}
                />
              ) : null}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={lifeline.potData}
                  margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
                  onMouseLeave={() => setHoveredPotIndex(null)}
                >
                  <XAxis
                    dataKey="age"
                    ticks={lifelineTicks}
                    interval={0}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    tickFormatter={(value) => Math.round(value).toLocaleString("nl-NL")}
                    width={60}
                  />
                  <Bar
                    dataKey="pensioen"
                    stackId="pots"
                    fill="#6672a8"
                    onMouseOver={(_, index) => setHoveredPotIndex(index)}
                  />
                  <Bar dataKey="cfk" stackId="pots" fill="#0d2a28" onMouseOver={(_, index) => setHoveredPotIndex(index)} />
                  <Bar dataKey="vrij" stackId="pots" fill="#d2bb5d" onMouseOver={(_, index) => setHoveredPotIndex(index)} />
                  <Bar dataKey="nextgen" stackId="pots" fill="#ffa07a" onMouseOver={(_, index) => setHoveredPotIndex(index)} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
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

        input.cfk-duration-slider::-webkit-slider-thumb {
          background: #0d2a28 !important;
        }

        input.cfk-duration-slider::-moz-range-thumb {
          background: #0d2a28 !important;
        }
      `}</style>
      </div>
    </div>
  );
};

export default InvestmentCalculator;
