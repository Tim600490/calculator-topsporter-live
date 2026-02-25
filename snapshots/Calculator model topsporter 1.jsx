import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

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

const InvestmentCalculator = () => {
  const [startAmount, setStartAmount] = useState(25000);
  const [monthlyDeposit, setMonthlyDeposit] = useState(1000);
  const [depositYears, setDepositYears] = useState(10);
  const [investmentHorizon, setInvestmentHorizon] = useState(25);
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
    if (depositYears > investmentHorizon) {
      setDepositYears(investmentHorizon);
    }
  }, [depositYears, investmentHorizon]);

  const calculationData = useMemo(() => {
    const data = [];
    let currentBalance = startAmount;
    let totalMonthlyDeposits = 0;

    const monthlyReturn = annualReturn / 12; // Maandelijks rendement

    for (let year = 1; year <= investmentHorizon; year++) {
      // Start van het jaar
      const yearStartBalance = currentBalance;

      // Voor elke maand in het jaar
      for (let month = 1; month <= 12; month++) {
        const currentMonth = (year - 1) * 12 + month;
        const activeDeposit = currentMonth <= depositYears * 12 ? monthlyDeposit : 0;

        // Rendement over huidige saldo
        currentBalance = currentBalance * (1 + monthlyReturn);

        // Maandelijkse storting aan het einde van de maand
        currentBalance += activeDeposit;
        totalMonthlyDeposits += activeDeposit;
      }

      const totalDeposits = startAmount + totalMonthlyDeposits;
      const accruedInterest = currentBalance - totalDeposits;

      data.push({
        year,
        balance: currentBalance,
        deposits: totalMonthlyDeposits, // Only monthly deposits, not including start amount
        interest: accruedInterest,
        initialBalance: startAmount,
        yearStartBalance
      });
    }

    return data;
  }, [startAmount, monthlyDeposit, depositYears, investmentHorizon, annualReturn]);

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
    let totalMonthlyDeposits = 0;
    const monthlyReturn = worstCaseProfiles[profile] / 12;

    for (let year = 1; year <= investmentHorizon; year++) {
      for (let month = 1; month <= 12; month++) {
        const currentMonth = (year - 1) * 12 + month;
        const activeDeposit = currentMonth <= depositYears * 12 ? monthlyDeposit : 0;

        currentBalance = currentBalance * (1 + monthlyReturn);
        currentBalance += activeDeposit;
        totalMonthlyDeposits += activeDeposit;
      }
    }
    return currentBalance;
  };

  // Calculate best case scenario
  const calculateBestCase = () => {
    let currentBalance = startAmount;
    let totalMonthlyDeposits = 0;
    const monthlyReturn = bestCaseProfiles[profile] / 12;

    for (let year = 1; year <= investmentHorizon; year++) {
      for (let month = 1; month <= 12; month++) {
        const currentMonth = (year - 1) * 12 + month;
        const activeDeposit = currentMonth <= depositYears * 12 ? monthlyDeposit : 0;

        currentBalance = currentBalance * (1 + monthlyReturn);
        currentBalance += activeDeposit;
        totalMonthlyDeposits += activeDeposit;
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

          {/* Monthly Deposit */}
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
                Inleg per maand
              </label>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                {formatCurrency(monthlyDeposit)}
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={monthlyDeposit}
                onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #D2BB5D 0%, #D2BB5D ${(monthlyDeposit / 10000) * 100}%, #E5E7EB ${(monthlyDeposit / 10000) * 100}%, #E5E7EB 100%)`,
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

          {/* Deposit Duration */}
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
                Inlegduur
              </label>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                {depositYears} jaar
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="range"
                min="0"
                max={investmentHorizon}
                step="1"
                value={Math.min(depositYears, investmentHorizon)}
                onChange={(e) => setDepositYears(Number(e.target.value))}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #D2BB5D 0%, #D2BB5D ${investmentHorizon === 0 ? 0 : (Math.min(depositYears, investmentHorizon) / investmentHorizon) * 100}%, #E5E7EB ${investmentHorizon === 0 ? 0 : (Math.min(depositYears, investmentHorizon) / investmentHorizon) * 100}%, #E5E7EB 100%)`,
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
              **Deze rekentool laat de te verwachten netto € resultaten zien, dus na aftrek van de kosten. Inleg loopt {depositYears} jaar en stopt daarna.
            </div>
          </div>
        </div>
      </div>

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
