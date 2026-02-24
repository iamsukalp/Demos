// ===== Conversational BI Demo - Banking Scenarios =====

const SCENARIOS = [
  // ===== 1. Deposit Portfolio Overview =====
  {
    id: "deposit_overview",
    title: "Deposit Portfolio Overview",
    triggerKeywords: ["deposits", "deposit trend", "deposit portfolio", "total deposits", "savings", "deposit growth", "CASA", "current account", "savings account"],
    greeting: "Hello! I've loaded the complete deposit portfolio data across all branches and product types. I can analyze trends, compare segments, or drill into specific deposit categories.",
    userQuestion: "Show me the total deposit trend over the past 12 months. How is our deposit base growing?",
    aiResponse: 'Total deposits have grown from <strong>$38.2B in November</strong> to <strong>$42.8B in October</strong>, reflecting a <strong>12.0% annualized growth rate</strong>. CASA deposits now represent <strong>41% of total deposits</strong>, up from 37% a year ago — improving our cost of funds. Term deposits saw a seasonal uptick in Q3 as customers locked in higher rates. YTD net deposit accretion stands at <span class="font-semibold text-primary">$4.6B</span>.',
    suggestions: [
      { label: "Branch-level performance", targetScenarioId: "branch_performance" },
      { label: "Net interest income impact", targetScenarioId: "nii_analysis" },
      { label: "Executive KPI scorecard", targetScenarioId: "kpi_scorecard" }
    ],
    insights: {
      cards: [
        { label: "Total Deposits", value: "$42.8B", detail: "Up 12.0% YoY from $38.2B in November 2023.", color: "blue" },
        { label: "CASA Ratio", value: "41% (+4pp YoY)", detail: "Low-cost deposit mix improving funding profile.", color: "emerald" },
        { label: "Net Accretion YTD", value: "$4.6B", detail: "Tracking 18% above annual deposit mobilization target.", color: "amber" }
      ],
      bullets: [
        "CASA deposits grew 22% YoY driven by salary account acquisition campaigns in Q1-Q2.",
        "Term deposit growth accelerated in Q3 (+$1.8B) as rate-sensitive customers locked in 5.25% APY.",
        "Digital-only savings accounts contributed $620M in net new deposits since launch in March."
      ],
      confidence: 94
    },
    chart: {
      type: "line",
      title: "Monthly Deposit Portfolio Trend",
      subtitle: "Nov 2023 - Oct 2024 (in $B)",
      labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
      datasets: [
        {
          label: "Total Deposits",
          data: [38.2, 38.8, 38.5, 38.9, 39.4, 39.8, 40.2, 40.9, 41.3, 41.8, 42.3, 42.8],
          borderColor: "#fb4e0b",
          backgroundColor: "rgba(251,78,11,0.08)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Prior Year",
          data: [34.1, 34.6, 34.2, 34.5, 34.9, 35.2, 35.6, 36.1, 36.5, 36.8, 37.2, 37.6],
          borderColor: "#94a3b8",
          borderDash: [8, 6],
          fill: false,
          tension: 0.3
        }
      ],
      summaryStats: [
        { label: "Current Balance", value: "$42.8B", color: "slate" },
        { label: "YoY Growth", value: "+12.0%", color: "emerald" }
      ]
    },
    table: {
      headers: ["Month", "Total Deposits", "CASA", "Term Deposits", "CASA Ratio", "MoM Change"],
      rows: [
        ["Nov 2023", "$38.2B", "$14.1B", "$24.1B", "37%", "--"],
        ["Jan 2024", "$38.5B", "$14.6B", "$23.9B", "38%", "-0.8%"],
        ["Apr 2024", "$39.8B", "$15.5B", "$24.3B", "39%", "+1.0%"],
        ["Jul 2024", "$41.3B", "$16.5B", "$24.8B", "40%", "+1.0%"],
        ["Sep 2024", "$42.3B", "$17.1B", "$25.2B", "40%", "+1.2%"],
        ["Oct 2024", "$42.8B", "$17.5B", "$25.3B", "41%", "+1.2%"]
      ]
    },
    sql: `WITH monthly_deposits AS (
  SELECT
    DATE_TRUNC('month', snapshot_date) AS month,
    SUM(balance) AS total_deposits,
    SUM(CASE WHEN product_type IN ('savings', 'current') THEN balance ELSE 0 END) AS casa_deposits,
    SUM(CASE WHEN product_type = 'term_deposit' THEN balance ELSE 0 END) AS term_deposits
  FROM banking.deposits d
  JOIN banking.accounts a ON d.account_id = a.account_id
  WHERE snapshot_date BETWEEN '2023-11-01' AND '2024-10-31'
  GROUP BY 1
)
SELECT
  month,
  ROUND(total_deposits / 1e9, 1) AS total_deposits_bn,
  ROUND(casa_deposits / 1e9, 1) AS casa_bn,
  ROUND(term_deposits / 1e9, 1) AS term_bn,
  ROUND(casa_deposits * 100.0 / total_deposits, 0) AS casa_ratio
FROM monthly_deposits
ORDER BY month;`,
    dataSource: "core_banking_warehouse.deposits_analytics",
    generationTime: 1.4
  },

  // ===== 2. Loan Portfolio Composition =====
  {
    id: "loan_portfolio",
    title: "Loan Portfolio Composition",
    triggerKeywords: ["loan portfolio", "loan composition", "loan mix", "lending", "loans", "loan breakdown", "credit portfolio", "advances"],
    greeting: "I've loaded the complete loan portfolio data segmented by product type. I can show composition, growth trends, or asset quality by segment.",
    userQuestion: "How is our loan portfolio distributed? Which loan product is the largest?",
    aiResponse: '<strong>Mortgages</strong> dominate at <strong>45% of the $28.4B loan book ($12.8B)</strong>, followed by Commercial Lending at 25% and Auto Loans at 12%. The portfolio is well-diversified with no single segment exceeding 50%. <strong>Personal loans</strong> are the fastest growing segment at <span class="font-semibold text-primary">+18% YoY</span>, driven by digital origination channels.',
    suggestions: [
      { label: "Asset quality & NPAs", targetScenarioId: "npa_analysis" },
      { label: "Loan growth analysis", targetScenarioId: "loan_growth" },
      { label: "Loan yield & pricing", targetScenarioId: "loan_yield" }
    ],
    insights: {
      cards: [
        { label: "Total Loan Book", value: "$28.4B", detail: "Grew 9.2% YoY from $26.0B.", color: "blue" },
        { label: "Largest Segment", value: "Mortgages — $12.8B (45%)", detail: "Average LTV of 72%, well within risk appetite.", color: "emerald" },
        { label: "Fastest Growing", value: "Personal Loans +18%", detail: "Digital origination driving 65% of new personal loans.", color: "amber" }
      ],
      bullets: [
        "Mortgage portfolio remains the anchor at 45% with strong collateral coverage.",
        "Commercial lending pipeline is robust at $3.2B, suggesting continued growth in Q4.",
        "Credit card outstandings grew 12% YoY, contributing 8% of the total loan book."
      ],
      confidence: 96
    },
    chart: {
      type: "doughnut",
      title: "Loan Portfolio Distribution",
      subtitle: "FY 2024 — percentage of $28.4B total loan book",
      labels: ["Mortgages", "Commercial", "Auto Loans", "Personal", "Credit Cards"],
      datasets: [
        {
          label: "Portfolio Share",
          data: [45, 25, 12, 10, 8],
          backgroundColor: ["#fb4e0b", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"],
          borderWidth: 0,
          hoverOffset: 8
        }
      ],
      summaryStats: [
        { label: "Total Loan Book", value: "$28.4B", color: "slate" },
        { label: "Top Segment", value: "Mortgages 45%", color: "emerald" }
      ]
    },
    table: {
      headers: ["Loan Product", "Outstanding", "% of Total", "Accounts", "Avg Ticket Size", "YoY Growth"],
      rows: [
        ["Mortgages", "$12,780M", "45%", "42,600", "$300K", "+8%"],
        ["Commercial", "$7,100M", "25%", "3,840", "$1.85M", "+11%"],
        ["Auto Loans", "$3,408M", "12%", "28,400", "$120K", "+6%"],
        ["Personal Loans", "$2,840M", "10%", "71,000", "$40K", "+18%"],
        ["Credit Cards", "$2,272M", "8%", "185,000", "$12.3K", "+12%"]
      ]
    },
    sql: `SELECT
  lp.product_name,
  ROUND(SUM(l.outstanding_balance) / 1e6, 0) AS outstanding_mn,
  ROUND(SUM(l.outstanding_balance) * 100.0
    / SUM(SUM(l.outstanding_balance)) OVER (), 1) AS pct_of_total,
  COUNT(DISTINCT l.loan_id) AS account_count,
  ROUND(AVG(l.outstanding_balance), 0) AS avg_ticket,
  ROUND(
    (SUM(l.outstanding_balance) - SUM(l.prior_year_balance))
    * 100.0 / NULLIF(SUM(l.prior_year_balance), 0), 1
  ) AS yoy_growth
FROM banking.loans l
JOIN banking.loan_products lp ON l.product_id = lp.product_id
WHERE l.status = 'active'
  AND l.snapshot_date = '2024-10-31'
GROUP BY lp.product_name
ORDER BY outstanding_mn DESC;`,
    dataSource: "core_banking_warehouse.lending_analytics",
    generationTime: 1.2
  },

  // ===== 3. NPA & Asset Quality =====
  {
    id: "npa_analysis",
    title: "NPA & Asset Quality",
    triggerKeywords: ["NPA", "non-performing", "asset quality", "bad loans", "NPL", "delinquency", "impaired", "overdue"],
    greeting: "Asset quality data is loaded with monthly NPA trends and segment breakdowns. I can analyze delinquency rates, provision adequacy, or risk migration patterns.",
    userQuestion: "What is our current NPA ratio? How has asset quality trended over the past year?",
    aiResponse: 'Gross NPA ratio has <strong>improved from 2.8% to 1.9%</strong> over the past 12 months — the lowest level in 5 years. Net NPA stands at <strong>0.6%</strong> after provisions. The improvement is driven by aggressive recovery efforts in the commercial portfolio and tighter underwriting standards implemented in Q1. Total gross NPAs are <span class="font-semibold text-primary">$540M</span> on a $28.4B book.',
    suggestions: [
      { label: "Loan portfolio breakdown", targetScenarioId: "loan_portfolio" },
      { label: "Credit risk segments", targetScenarioId: "credit_risk_segments" },
      { label: "Provision coverage", targetScenarioId: "provision_coverage" }
    ],
    insights: {
      cards: [
        { label: "Gross NPA Ratio", value: "1.9% (↓ from 2.8%)", detail: "Lowest NPA ratio in 5 years, improving for 10 consecutive months.", color: "emerald" },
        { label: "Net NPA Ratio", value: "0.6%", detail: "Adequate provisioning at 68% coverage of gross NPAs.", color: "blue" },
        { label: "Total Gross NPAs", value: "$540M", detail: "Down from $720M a year ago — $180M reduction.", color: "amber" }
      ],
      bullets: [
        "Commercial NPA recoveries of $95M in Q3 were the largest quarterly recovery on record.",
        "Retail delinquency (30+ DPD) declined to 1.2% from 1.8% after enhanced collection workflows.",
        "No new large-ticket NPAs (>$10M) added in the last two quarters."
      ],
      confidence: 93
    },
    chart: {
      type: "line",
      title: "Gross NPA Ratio Trend",
      subtitle: "Nov 2023 - Oct 2024 — percentage of total advances",
      labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
      datasets: [
        {
          label: "Gross NPA %",
          data: [2.8, 2.7, 2.6, 2.5, 2.4, 2.3, 2.2, 2.1, 2.1, 2.0, 1.9, 1.9],
          borderColor: "#fb4e0b",
          backgroundColor: "rgba(251,78,11,0.08)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Industry Avg",
          data: [3.2, 3.2, 3.1, 3.1, 3.1, 3.0, 3.0, 3.0, 2.9, 2.9, 2.9, 2.8],
          borderColor: "#94a3b8",
          borderDash: [8, 6],
          fill: false,
          tension: 0.3,
          pointRadius: 0
        }
      ],
      summaryStats: [
        { label: "Current NPA", value: "1.9%", color: "emerald" },
        { label: "12-Mo Improvement", value: "-0.9pp", color: "slate" }
      ]
    },
    table: {
      headers: ["Month", "Gross NPA %", "Net NPA %", "Gross NPAs ($M)", "Recoveries ($M)", "Slippages ($M)"],
      rows: [
        ["Nov 2023", "2.8%", "1.1%", "$720M", "$28M", "$42M"],
        ["Jan 2024", "2.6%", "0.9%", "$680M", "$35M", "$30M"],
        ["Apr 2024", "2.3%", "0.8%", "$620M", "$45M", "$25M"],
        ["Jul 2024", "2.1%", "0.7%", "$580M", "$52M", "$22M"],
        ["Sep 2024", "1.9%", "0.6%", "$550M", "$38M", "$18M"],
        ["Oct 2024", "1.9%", "0.6%", "$540M", "$32M", "$20M"]
      ]
    },
    sql: `WITH npa_monthly AS (
  SELECT
    DATE_TRUNC('month', snapshot_date) AS month,
    SUM(CASE WHEN npa_status = 'non_performing' THEN outstanding_balance ELSE 0 END) AS gross_npa,
    SUM(outstanding_balance) AS total_advances,
    SUM(CASE WHEN npa_status = 'non_performing' THEN outstanding_balance - provision_amount ELSE 0 END) AS net_npa,
    SUM(CASE WHEN recovery_flag = true THEN recovery_amount ELSE 0 END) AS recoveries,
    SUM(CASE WHEN slippage_flag = true THEN outstanding_balance ELSE 0 END) AS slippages
  FROM banking.non_performing_assets npa
  JOIN banking.loans l ON npa.loan_id = l.loan_id
  WHERE snapshot_date BETWEEN '2023-11-01' AND '2024-10-31'
  GROUP BY 1
)
SELECT
  month,
  ROUND(gross_npa * 100.0 / total_advances, 1) AS gross_npa_pct,
  ROUND(net_npa * 100.0 / total_advances, 1) AS net_npa_pct,
  ROUND(gross_npa / 1e6, 0) AS gross_npa_mn,
  ROUND(recoveries / 1e6, 0) AS recoveries_mn,
  ROUND(slippages / 1e6, 0) AS slippages_mn
FROM npa_monthly
ORDER BY month;`,
    dataSource: "core_banking_warehouse.risk_analytics",
    generationTime: 1.8
  },

  // ===== 4. Net Interest Income Analysis =====
  {
    id: "nii_analysis",
    title: "Net Interest Income Analysis",
    triggerKeywords: ["NII", "net interest income", "interest income", "interest margin", "NIM", "spread", "interest revenue"],
    greeting: "I've prepared net interest income data with quarterly breakdown. I can analyze NIM trends, interest rate sensitivity, or compare income vs expense drivers.",
    userQuestion: "What is our net interest income? How is the net interest margin trending?",
    aiResponse: 'Net Interest Income for FY 2024 YTD is <strong>$3.2B</strong>, up <strong>14% YoY</strong>. The Net Interest Margin (NIM) has expanded to <strong>3.45%</strong>, up 15bps from 3.30% a year ago, driven by loan repricing outpacing deposit cost increases. Q3 NII of <strong>$860M</strong> was the strongest quarter, benefiting from the full impact of the June rate hike on floating-rate loans.',
    suggestions: [
      { label: "Deposit portfolio trends", targetScenarioId: "deposit_overview" },
      { label: "Fee & commission income", targetScenarioId: "fee_income" },
      { label: "Executive KPI scorecard", targetScenarioId: "kpi_scorecard" }
    ],
    insights: {
      cards: [
        { label: "YTD Net Interest Income", value: "$3.2B (+14% YoY)", detail: "On track to exceed $4.2B full-year target.", color: "blue" },
        { label: "Net Interest Margin", value: "3.45% (+15bps)", detail: "Expanded from 3.30% driven by asset repricing.", color: "emerald" },
        { label: "Best Quarter", value: "Q3 — $860M NII", detail: "Full-quarter impact of floating-rate loan repricing.", color: "amber" }
      ],
      bullets: [
        "Loan yield expanded 28bps YoY while cost of deposits increased only 13bps.",
        "CASA ratio improvement contributing ~5bps to NIM expansion.",
        "Interest rate sensitivity analysis shows +$45M NII impact per 25bps rate increase."
      ],
      confidence: 95
    },
    chart: {
      type: "bar",
      title: "Quarterly Interest Income vs Expense",
      subtitle: "FY 2024 — with NIM trend on secondary axis",
      labels: ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024 (Est)"],
      datasets: [
        {
          label: "Interest Income",
          data: [1420, 1480, 1540, 1580],
          backgroundColor: "#fb4e0b",
          borderRadius: 4
        },
        {
          label: "Interest Expense",
          data: [640, 660, 680, 700],
          backgroundColor: "#94a3b8",
          borderRadius: 4
        },
        {
          label: "NIM %",
          data: [3.32, 3.38, 3.45, 3.48],
          type: "line",
          borderColor: "#10b981",
          backgroundColor: "transparent",
          tension: 0.3,
          yAxisID: "y1",
          pointRadius: 5,
          pointBackgroundColor: "#10b981",
          borderWidth: 2.5
        }
      ],
      summaryStats: [
        { label: "YTD NII", value: "$3.2B", color: "slate" },
        { label: "Current NIM", value: "3.45%", color: "emerald" }
      ]
    },
    table: {
      headers: ["Quarter", "Interest Income", "Interest Expense", "NII", "NIM %", "YoY Change"],
      rows: [
        ["Q1 2024", "$1,420M", "$640M", "$780M", "3.32%", "+12%"],
        ["Q2 2024", "$1,480M", "$660M", "$820M", "3.38%", "+13%"],
        ["Q3 2024", "$1,540M", "$680M", "$860M", "3.45%", "+16%"],
        ["Q4 2024 (Est)", "$1,580M", "$700M", "$880M", "3.48%", "+14%"]
      ]
    },
    sql: `WITH quarterly_nii AS (
  SELECT
    DATE_TRUNC('quarter', transaction_date) AS quarter,
    SUM(CASE WHEN type = 'interest_income' THEN amount ELSE 0 END) AS interest_income,
    SUM(CASE WHEN type = 'interest_expense' THEN amount ELSE 0 END) AS interest_expense
  FROM banking.interest_income
  WHERE transaction_date BETWEEN '2024-01-01' AND '2024-12-31'
  GROUP BY 1
),
avg_assets AS (
  SELECT
    DATE_TRUNC('quarter', snapshot_date) AS quarter,
    AVG(total_earning_assets) AS avg_earning_assets
  FROM banking.balance_sheet
  WHERE snapshot_date BETWEEN '2024-01-01' AND '2024-12-31'
  GROUP BY 1
)
SELECT
  q.quarter,
  ROUND(q.interest_income / 1e6, 0) AS interest_income_mn,
  ROUND(q.interest_expense / 1e6, 0) AS interest_expense_mn,
  ROUND((q.interest_income - q.interest_expense) / 1e6, 0) AS nii_mn,
  ROUND((q.interest_income - q.interest_expense) * 100.0
    / a.avg_earning_assets, 2) AS nim_pct
FROM quarterly_nii q
JOIN avg_assets a ON q.quarter = a.quarter
ORDER BY q.quarter;`,
    dataSource: "core_banking_warehouse.finance_analytics",
    generationTime: 1.6
  },

  // ===== 5. Branch Performance Ranking =====
  {
    id: "branch_performance",
    title: "Branch Performance Ranking",
    triggerKeywords: ["branch performance", "branch ranking", "branch revenue", "branch", "branches", "top branches", "branch profitability"],
    greeting: "Branch performance data is loaded with revenue, deposit, and efficiency metrics. I can rank branches, compare regions, or drill into individual branch details.",
    userQuestion: "How are our branches performing? Which branches are the top performers?",
    aiResponse: '<strong>Manhattan Main</strong> leads all branches with <strong>$285M in revenue</strong> and the highest deposit mobilization at $4.2B. The top 5 branches generate <strong>38% of total branch revenue</strong>. <strong>Downtown Chicago</strong> showed the highest growth at <span class="font-semibold text-primary">+22% YoY</span>. Three branches are flagged for efficiency improvement with cost-to-income ratios above 65%.',
    suggestions: [
      { label: "Digital banking adoption", targetScenarioId: "digital_adoption" },
      { label: "Deposit portfolio overview", targetScenarioId: "deposit_overview" },
      { label: "Operational efficiency", targetScenarioId: "operational_efficiency" }
    ],
    insights: {
      cards: [
        { label: "Top Branch", value: "Manhattan Main — $285M", detail: "Highest revenue and deposit mobilization ($4.2B).", color: "blue" },
        { label: "Fastest Growing", value: "Downtown Chicago +22%", detail: "New commercial banking team driving growth.", color: "emerald" },
        { label: "Needs Attention", value: "3 Branches Above 65% CIR", detail: "Suburban locations with declining foot traffic.", color: "rose" }
      ],
      bullets: [
        "Top 5 branches contribute 38% of total revenue from 12% of the branch network.",
        "Average branch revenue increased 8% YoY driven by wealth management cross-sells.",
        "Digital-first branches (opened 2023) showing 15% better cost efficiency than traditional."
      ],
      confidence: 91
    },
    chart: {
      type: "bar",
      indexAxis: "y",
      title: "Top 8 Branches by Revenue",
      subtitle: "FY 2024 YTD — revenue in $M",
      labels: ["Manhattan Main", "Downtown Chicago", "Midtown NYC", "Beverly Hills", "Boston Financial", "SF Union Sq", "Miami Beach", "Dallas Central"],
      datasets: [
        {
          label: "Revenue ($M)",
          data: [285, 242, 228, 195, 182, 168, 155, 142],
          backgroundColor: ["#fb4e0b", "#fb4e0b", "#fb4e0b", "#10b981", "#10b981", "#10b981", "#f59e0b", "#f59e0b"],
          borderRadius: 4
        }
      ],
      summaryStats: [
        { label: "Top Branch", value: "$285M", color: "slate" },
        { label: "Top 8 Total", value: "$1.6B", color: "emerald" }
      ]
    },
    table: {
      headers: ["Branch", "Revenue", "Deposits", "New Accounts", "CIR", "YoY Growth"],
      rows: [
        ["Manhattan Main", "$285M", "$4.2B", "3,420", "42%", "+12%"],
        ["Downtown Chicago", "$242M", "$3.1B", "2,890", "45%", "+22%"],
        ["Midtown NYC", "$228M", "$3.8B", "2,650", "44%", "+9%"],
        ["Beverly Hills", "$195M", "$2.9B", "1,820", "48%", "+14%"],
        ["Boston Financial", "$182M", "$2.6B", "2,100", "51%", "+7%"],
        ["SF Union Square", "$168M", "$2.4B", "1,950", "53%", "+11%"],
        ["Miami Beach", "$155M", "$2.1B", "1,780", "56%", "+6%"],
        ["Dallas Central", "$142M", "$1.9B", "1,640", "58%", "+5%"]
      ]
    },
    sql: `SELECT
  b.branch_name,
  ROUND(SUM(m.revenue) / 1e6, 0) AS revenue_mn,
  ROUND(SUM(m.total_deposits) / 1e9, 1) AS deposits_bn,
  SUM(m.new_accounts) AS new_accounts,
  ROUND(SUM(m.operating_cost) * 100.0
    / NULLIF(SUM(m.revenue), 0), 0) AS cost_to_income,
  ROUND(
    (SUM(m.revenue) - SUM(m.prior_year_revenue))
    * 100.0 / NULLIF(SUM(m.prior_year_revenue), 0), 0
  ) AS yoy_growth
FROM banking.branch_metrics m
JOIN banking.branches b ON m.branch_id = b.branch_id
WHERE m.metric_date BETWEEN '2024-01-01' AND '2024-10-31'
GROUP BY b.branch_name
ORDER BY revenue_mn DESC
LIMIT 8;`,
    dataSource: "core_banking_warehouse.branch_analytics",
    generationTime: 1.5
  },

  // ===== 6. Digital Banking Adoption =====
  {
    id: "digital_adoption",
    title: "Digital Banking Adoption",
    triggerKeywords: ["digital banking", "digital adoption", "mobile banking", "online banking", "digital channels", "app usage", "digital transactions"],
    greeting: "Digital banking metrics are loaded with channel-level transaction data. I can analyze adoption trends, compare channels, or show migration patterns from branch to digital.",
    userQuestion: "How is digital banking adoption trending? What percentage of transactions are digital now?",
    aiResponse: 'Digital channel adoption has reached <strong>72% of all transactions</strong>, up from 58% a year ago. <strong>Mobile banking</strong> leads the growth with transactions up <strong>45% YoY</strong>, now processing 4.2M transactions monthly. Online banking holds steady at 18% of volume, while branch transactions have declined to <span class="font-semibold text-primary">28% from 42%</span> a year ago.',
    suggestions: [
      { label: "Branch performance impact", targetScenarioId: "branch_performance" },
      { label: "Customer acquisition channels", targetScenarioId: "customer_acquisition" },
      { label: "Operational efficiency gains", targetScenarioId: "operational_efficiency" }
    ],
    insights: {
      cards: [
        { label: "Digital Adoption", value: "72% of Transactions", detail: "Up from 58% a year ago — 14pp improvement.", color: "emerald" },
        { label: "Mobile Transactions", value: "4.2M/month (+45%)", detail: "Highest growth channel, driven by P2P and bill payments.", color: "blue" },
        { label: "Cost Savings", value: "$32M Annually", detail: "Branch-to-digital migration saving $0.85 per transaction.", color: "amber" }
      ],
      bullets: [
        "Mobile app active users grew from 680K to 1.1M — a 62% increase in MAU.",
        "Digital account opening now represents 58% of new accounts (up from 35%).",
        "Average mobile session duration increased 22% after UX redesign in Q2."
      ],
      confidence: 92
    },
    chart: {
      type: "line",
      title: "Transaction Volume by Channel",
      subtitle: "Nov 2023 - Oct 2024 — monthly transactions in millions",
      labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
      datasets: [
        {
          label: "Mobile",
          data: [2.9, 3.0, 3.1, 3.2, 3.4, 3.5, 3.6, 3.8, 3.9, 4.0, 4.1, 4.2],
          borderColor: "#fb4e0b",
          backgroundColor: "rgba(251,78,11,0.08)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Online",
          data: [1.1, 1.1, 1.1, 1.0, 1.1, 1.1, 1.0, 1.1, 1.1, 1.0, 1.1, 1.1],
          borderColor: "#10b981",
          fill: false,
          tension: 0.3
        },
        {
          label: "Branch",
          data: [2.8, 2.7, 2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7, 1.6],
          borderColor: "#f59e0b",
          fill: false,
          tension: 0.3
        }
      ],
      summaryStats: [
        { label: "Digital Share", value: "72%", color: "emerald" },
        { label: "Mobile Growth", value: "+45% YoY", color: "slate" }
      ]
    },
    table: {
      headers: ["Month", "Mobile", "Online", "Branch", "Total", "Digital %"],
      rows: [
        ["Nov 2023", "2.9M", "1.1M", "2.8M", "6.8M", "59%"],
        ["Jan 2024", "3.1M", "1.1M", "2.5M", "6.7M", "63%"],
        ["Apr 2024", "3.5M", "1.1M", "2.2M", "6.8M", "68%"],
        ["Jul 2024", "3.9M", "1.1M", "1.9M", "6.9M", "72%"],
        ["Sep 2024", "4.1M", "1.1M", "1.7M", "6.9M", "75%"],
        ["Oct 2024", "4.2M", "1.1M", "1.6M", "6.9M", "77%"]
      ]
    },
    sql: `WITH channel_monthly AS (
  SELECT
    DATE_TRUNC('month', transaction_date) AS month,
    channel,
    COUNT(*) AS transaction_count
  FROM banking.channel_transactions
  WHERE transaction_date BETWEEN '2023-11-01' AND '2024-10-31'
  GROUP BY 1, 2
)
SELECT
  month,
  MAX(CASE WHEN channel = 'mobile' THEN transaction_count END) AS mobile,
  MAX(CASE WHEN channel = 'online' THEN transaction_count END) AS online,
  MAX(CASE WHEN channel = 'branch' THEN transaction_count END) AS branch,
  SUM(transaction_count) AS total,
  ROUND(
    SUM(CASE WHEN channel IN ('mobile', 'online') THEN transaction_count ELSE 0 END)
    * 100.0 / SUM(transaction_count), 0
  ) AS digital_pct
FROM channel_monthly
GROUP BY month
ORDER BY month;`,
    dataSource: "core_banking_warehouse.digital_analytics",
    generationTime: 1.3
  },

  // ===== 7. Credit Risk Segmentation =====
  {
    id: "credit_risk_segments",
    title: "Credit Risk Segmentation",
    triggerKeywords: ["credit risk", "risk segments", "risk distribution", "credit quality", "risk rating", "risk profile", "risk grades"],
    greeting: "Credit risk segmentation data is ready across the entire loan book. I can show risk distribution, migration trends, or concentration analysis.",
    userQuestion: "How is our loan portfolio distributed across credit risk segments? Are there any concentration concerns?",
    aiResponse: 'The loan portfolio shows a <strong>healthy risk distribution</strong> with <strong>42% in Low Risk</strong> and <strong>28% in Medium Risk</strong> categories. Only <strong>4% ($1.1B) is in Watch List</strong> status requiring enhanced monitoring. Risk migration has been favorable — <span class="font-semibold text-primary">$320M migrated upward</span> from Medium to Low risk in the last quarter, while downgrades were limited to $85M.',
    suggestions: [
      { label: "NPA & asset quality", targetScenarioId: "npa_analysis" },
      { label: "Provision coverage", targetScenarioId: "provision_coverage" },
      { label: "Loan portfolio details", targetScenarioId: "loan_portfolio" }
    ],
    insights: {
      cards: [
        { label: "Low Risk Portfolio", value: "42% — $11.9B", detail: "Prime borrowers with <2% probability of default.", color: "emerald" },
        { label: "Watch List", value: "4% — $1.1B", detail: "23 accounts under enhanced monitoring protocols.", color: "rose" },
        { label: "Risk Migration", value: "+$320M Upgrades in Q3", detail: "Net positive migration for 4th consecutive quarter.", color: "blue" }
      ],
      bullets: [
        "70% of the portfolio is rated Low or Medium risk — well within risk appetite framework.",
        "Commercial real estate concentration at 18% is below the 20% internal limit.",
        "Watch List accounts reduced from 32 to 23 after Q3 remediation efforts."
      ],
      confidence: 91
    },
    chart: {
      type: "doughnut",
      title: "Loan Portfolio by Risk Grade",
      subtitle: "As of Oct 2024 — percentage of $28.4B total loan book",
      labels: ["Low Risk", "Medium Risk", "Moderate Risk", "High Risk", "Watch List"],
      datasets: [
        {
          label: "Risk Distribution",
          data: [42, 28, 18, 8, 4],
          backgroundColor: ["#10b981", "#fb4e0b", "#f59e0b", "#ef4444", "#7c3aed"],
          borderWidth: 0,
          hoverOffset: 8
        }
      ],
      summaryStats: [
        { label: "Low + Medium", value: "70%", color: "emerald" },
        { label: "Watch List", value: "4% ($1.1B)", color: "rose" }
      ]
    },
    table: {
      headers: ["Risk Grade", "Outstanding", "% of Book", "Accounts", "Avg PD", "QoQ Migration"],
      rows: [
        ["Low Risk", "$11,928M", "42%", "148,200", "0.8%", "+$320M inflow"],
        ["Medium Risk", "$7,952M", "28%", "42,600", "2.5%", "-$180M net"],
        ["Moderate Risk", "$5,112M", "18%", "18,400", "5.2%", "-$95M net"],
        ["High Risk", "$2,272M", "8%", "6,800", "12.1%", "-$42M net"],
        ["Watch List", "$1,136M", "4%", "23", "25.0%", "-$3M net"]
      ]
    },
    sql: `WITH risk_distribution AS (
  SELECT
    cr.risk_grade,
    SUM(l.outstanding_balance) AS total_outstanding,
    COUNT(DISTINCT l.loan_id) AS account_count,
    ROUND(AVG(cr.probability_of_default) * 100, 1) AS avg_pd
  FROM banking.credit_risk cr
  JOIN banking.loans l ON cr.loan_id = l.loan_id
  WHERE l.status = 'active'
    AND cr.assessment_date = '2024-10-31'
  GROUP BY cr.risk_grade
)
SELECT
  risk_grade,
  ROUND(total_outstanding / 1e6, 0) AS outstanding_mn,
  ROUND(total_outstanding * 100.0
    / SUM(total_outstanding) OVER (), 1) AS pct_of_book,
  account_count,
  avg_pd
FROM risk_distribution
ORDER BY
  CASE risk_grade
    WHEN 'Low Risk' THEN 1
    WHEN 'Medium Risk' THEN 2
    WHEN 'Moderate Risk' THEN 3
    WHEN 'High Risk' THEN 4
    WHEN 'Watch List' THEN 5
  END;`,
    dataSource: "core_banking_warehouse.risk_analytics",
    generationTime: 1.7
  },

  // ===== 8. Fee & Commission Income =====
  {
    id: "fee_income",
    title: "Fee & Commission Income",
    triggerKeywords: ["fee income", "non-interest income", "fees", "commission", "fee revenue", "service charges", "other income"],
    greeting: "Fee and commission income data is loaded across all revenue streams. I can break down by category, compare periods, or analyze contribution trends.",
    userQuestion: "What is our non-interest income? How is fee income distributed across business lines?",
    aiResponse: 'Non-interest income reached <strong>$890M YTD</strong>, comprising <strong>22% of total revenue</strong>. <strong>Transaction & service fees</strong> lead at $310M (35%), followed by Wealth Management at $245M (28%). Fee income has grown <strong>18% YoY</strong>, outpacing NII growth — a positive sign for revenue diversification. <span class="font-semibold text-primary">Trade finance fees</span> showed the strongest growth at +32%.',
    suggestions: [
      { label: "Net interest income", targetScenarioId: "nii_analysis" },
      { label: "Wealth management AUM", targetScenarioId: "wealth_management" },
      { label: "KPI variance analysis", targetScenarioId: "kpi_vs_target" }
    ],
    insights: {
      cards: [
        { label: "Total Fee Income", value: "$890M YTD (+18%)", detail: "On track to exceed $1.1B full-year target.", color: "blue" },
        { label: "Fee-to-Revenue Ratio", value: "22% (↑ from 19%)", detail: "Improving diversification reduces NII dependency.", color: "emerald" },
        { label: "Fastest Growing", value: "Trade Finance +32%", detail: "Cross-border transaction volumes up 40% YoY.", color: "amber" }
      ],
      bullets: [
        "Wealth management fees grew 24% YoY driven by AUM growth and advisory mandates.",
        "Card interchange fees of $135M represent a stable recurring income stream.",
        "Insurance distribution commissions up 15% after bancassurance partnership expansion."
      ],
      confidence: 93
    },
    chart: {
      type: "bar",
      title: "Fee Income by Category",
      subtitle: "FY 2024 YTD — in $M",
      labels: ["Transaction Fees", "Wealth Mgmt", "Trade Finance", "Cards", "Insurance", "Other"],
      datasets: [
        {
          label: "Fee Income ($M)",
          data: [310, 245, 125, 95, 65, 50],
          backgroundColor: ["#fb4e0b", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#94a3b8"],
          borderRadius: 4
        }
      ],
      summaryStats: [
        { label: "Total Fee Income", value: "$890M", color: "slate" },
        { label: "YoY Growth", value: "+18%", color: "emerald" }
      ]
    },
    table: {
      headers: ["Category", "FY 2024 YTD", "FY 2023 YTD", "Growth", "% of Total", "Key Driver"],
      rows: [
        ["Transaction Fees", "$310M", "$268M", "+16%", "35%", "Digital payments volume"],
        ["Wealth Management", "$245M", "$198M", "+24%", "28%", "AUM growth + advisory"],
        ["Trade Finance", "$125M", "$95M", "+32%", "14%", "Cross-border volumes"],
        ["Cards", "$95M", "$85M", "+12%", "11%", "Interchange + annual fees"],
        ["Insurance", "$65M", "$57M", "+15%", "7%", "Bancassurance expansion"],
        ["Other", "$50M", "$52M", "-4%", "5%", "Miscellaneous services"]
      ]
    },
    sql: `SELECT
  rs.category,
  ROUND(SUM(CASE WHEN fi.fiscal_year = 2024 THEN fi.amount ELSE 0 END) / 1e6, 0) AS fy24_mn,
  ROUND(SUM(CASE WHEN fi.fiscal_year = 2023 THEN fi.amount ELSE 0 END) / 1e6, 0) AS fy23_mn,
  ROUND(
    (SUM(CASE WHEN fi.fiscal_year = 2024 THEN fi.amount ELSE 0 END) -
     SUM(CASE WHEN fi.fiscal_year = 2023 THEN fi.amount ELSE 0 END))
    * 100.0 / NULLIF(SUM(CASE WHEN fi.fiscal_year = 2023 THEN fi.amount ELSE 0 END), 0), 0
  ) AS yoy_growth,
  ROUND(
    SUM(CASE WHEN fi.fiscal_year = 2024 THEN fi.amount ELSE 0 END) * 100.0
    / SUM(SUM(CASE WHEN fi.fiscal_year = 2024 THEN fi.amount ELSE 0 END)) OVER (), 0
  ) AS pct_of_total
FROM banking.fee_income fi
JOIN banking.revenue_streams rs ON fi.stream_id = rs.stream_id
WHERE fi.fiscal_year IN (2023, 2024)
GROUP BY rs.category
ORDER BY fy24_mn DESC;`,
    dataSource: "core_banking_warehouse.finance_analytics",
    generationTime: 1.4
  },

  // ===== 9. Customer Acquisition Trends =====
  {
    id: "customer_acquisition",
    title: "Customer Acquisition Trends",
    triggerKeywords: ["new customers", "customer acquisition", "new accounts", "account opening", "customer growth", "onboarding"],
    greeting: "Customer acquisition data is loaded with channel-level breakdowns. I can analyze monthly trends, conversion rates, or channel effectiveness.",
    userQuestion: "How many new customers are we acquiring? What channels are driving growth?",
    aiResponse: 'We\'ve opened <strong>45,200 new accounts YTD</strong>, up <strong>22% from 37,100</strong> in the prior year period. <strong>Digital channels</strong> now drive <strong>58% of acquisitions</strong>, a major shift from 35% two years ago. Monthly run-rate has grown from 3,200 in January to <span class="font-semibold text-primary">5,800 in October</span>. The salary account campaign in Q2 was a standout success, onboarding 8,400 corporate salary accounts.',
    suggestions: [
      { label: "Customer segmentation", targetScenarioId: "customer_segments" },
      { label: "Digital adoption trends", targetScenarioId: "digital_adoption" },
      { label: "Customer attrition", targetScenarioId: "customer_attrition" }
    ],
    insights: {
      cards: [
        { label: "YTD New Accounts", value: "45,200 (+22% YoY)", detail: "On track to exceed 55K full-year target.", color: "emerald" },
        { label: "Digital Acquisition", value: "58% of New Accounts", detail: "Up from 35% two years ago — branch dependency declining.", color: "blue" },
        { label: "Best Month", value: "October — 5,800", detail: "Record month driven by festive season and digital campaigns.", color: "amber" }
      ],
      bullets: [
        "Salary account campaign in Q2 onboarded 8,400 corporate accounts in 3 months.",
        "Cost per acquisition via digital channels is $42 vs $185 for branch walk-ins.",
        "Referral program contributed 12% of new accounts with highest activation rates."
      ],
      confidence: 92
    },
    chart: {
      type: "bar",
      title: "New Accounts per Month by Channel",
      subtitle: "Jan - Oct 2024",
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
      datasets: [
        {
          label: "Digital",
          data: [1800, 1900, 2200, 2400, 2600, 2800, 3000, 3100, 3200, 3400],
          backgroundColor: "#fb4e0b",
          borderRadius: 4,
          stack: "stack1"
        },
        {
          label: "Branch",
          data: [1100, 1000, 1000, 950, 900, 850, 850, 800, 780, 750],
          backgroundColor: "#f59e0b",
          borderRadius: 4,
          stack: "stack1"
        },
        {
          label: "Referral",
          data: [300, 320, 380, 420, 450, 500, 520, 550, 580, 650],
          backgroundColor: "#10b981",
          borderRadius: 4,
          stack: "stack1"
        }
      ],
      summaryStats: [
        { label: "YTD Total", value: "45,200", color: "slate" },
        { label: "Digital Share", value: "58%", color: "emerald" }
      ]
    },
    table: {
      headers: ["Month", "Digital", "Branch", "Referral", "Total", "Digital %"],
      rows: [
        ["Jan 2024", "1,800", "1,100", "300", "3,200", "56%"],
        ["Mar 2024", "2,200", "1,000", "380", "3,580", "61%"],
        ["May 2024", "2,600", "900", "450", "3,950", "66%"],
        ["Jul 2024", "3,000", "850", "520", "4,370", "69%"],
        ["Sep 2024", "3,200", "780", "580", "4,560", "70%"],
        ["Oct 2024", "3,400", "750", "650", "4,800", "71%"]
      ]
    },
    sql: `SELECT
  DATE_TRUNC('month', ao.opened_date) AS month,
  COUNT(*) FILTER (WHERE ao.channel = 'digital') AS digital,
  COUNT(*) FILTER (WHERE ao.channel = 'branch') AS branch,
  COUNT(*) FILTER (WHERE ao.channel = 'referral') AS referral,
  COUNT(*) AS total,
  ROUND(
    COUNT(*) FILTER (WHERE ao.channel = 'digital') * 100.0 / COUNT(*), 0
  ) AS digital_pct
FROM banking.account_openings ao
JOIN banking.customers c ON ao.customer_id = c.customer_id
WHERE ao.opened_date BETWEEN '2024-01-01' AND '2024-10-31'
GROUP BY 1
ORDER BY 1;`,
    dataSource: "core_banking_warehouse.customer_analytics",
    generationTime: 1.3
  },

  // ===== 10. Customer Segmentation =====
  {
    id: "customer_segments",
    title: "Customer Segmentation",
    triggerKeywords: ["customer segments", "segmentation", "customer tiers", "HNW", "high net worth", "affluent", "retail banking", "mass affluent"],
    greeting: "Customer segmentation data is loaded with tier distribution and revenue contribution. I can analyze segment migration, profitability, or product penetration.",
    userQuestion: "How is our customer base segmented? Which segment contributes the most to revenue?",
    aiResponse: 'Our <strong>2.1M customers</strong> are distributed across four tiers. <strong>HNW clients</strong> (1.2% of base, 25,200 customers) contribute a disproportionate <strong>38% of total revenue</strong>. The <strong>Mass Affluent</strong> segment is growing fastest at <span class="font-semibold text-primary">+15% QoQ</span>, driven by wealth management cross-sells and upgraded relationship banking. Retail banking remains the largest segment by volume at 68% of the customer base.',
    suggestions: [
      { label: "New customer trends", targetScenarioId: "customer_acquisition" },
      { label: "Wealth management AUM", targetScenarioId: "wealth_management" },
      { label: "Deposit portfolio", targetScenarioId: "deposit_overview" }
    ],
    insights: {
      cards: [
        { label: "Total Customers", value: "2.1M Active Accounts", detail: "Net customer growth of 3.8% YoY.", color: "blue" },
        { label: "HNW Revenue Share", value: "38% from 1.2% of Customers", detail: "25,200 HNW clients with avg relationship of $2.4M.", color: "emerald" },
        { label: "Fastest Growing", value: "Mass Affluent +15% QoQ", detail: "Relationship banking upgrades driving segment growth.", color: "amber" }
      ],
      bullets: [
        "HNW clients have an average product holding of 6.8 products vs 2.1 for Retail.",
        "Mass Affluent-to-HNW conversion rate improved from 2.1% to 3.4% after targeted campaigns.",
        "Retail segment digital adoption at 78% — highest across all tiers."
      ],
      confidence: 90
    },
    chart: {
      type: "bar",
      title: "Customer Segments — Quarterly Trend",
      subtitle: "Q1 2024 to Q4 2024 — customer count in thousands",
      labels: ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024 (Est)"],
      datasets: [
        {
          label: "HNW",
          data: [23.8, 24.2, 24.8, 25.2],
          backgroundColor: "#fb4e0b",
          borderRadius: 4
        },
        {
          label: "Affluent",
          data: [142, 148, 155, 162],
          backgroundColor: "#10b981",
          borderRadius: 4
        },
        {
          label: "Mass Affluent",
          data: [385, 398, 412, 428],
          backgroundColor: "#f59e0b",
          borderRadius: 4
        },
        {
          label: "Retail",
          data: [1380, 1395, 1412, 1428],
          backgroundColor: "#94a3b8",
          borderRadius: 4
        }
      ],
      summaryStats: [
        { label: "Total Customers", value: "2.1M", color: "slate" },
        { label: "HNW Growth", value: "+5.9% QoQ", color: "emerald" }
      ]
    },
    table: {
      headers: ["Segment", "Customers", "% of Base", "Revenue", "Avg Relationship", "Product Holdings"],
      rows: [
        ["HNW (>$1M)", "25,200", "1.2%", "$1,520M", "$2.4M", "6.8"],
        ["Affluent ($250K-$1M)", "162,000", "7.7%", "$980M", "$480K", "4.5"],
        ["Mass Affluent ($50K-$250K)", "428,000", "20.4%", "$820M", "$120K", "3.2"],
        ["Retail (<$50K)", "1,428,000", "68.0%", "$680M", "$12K", "2.1"],
        ["Small Business", "56,800", "2.7%", "$245M", "$85K", "3.8"]
      ]
    },
    sql: `WITH customer_segments AS (
  SELECT
    CASE
      WHEN cs.total_relationship_value >= 1000000 THEN 'HNW (>$1M)'
      WHEN cs.total_relationship_value >= 250000  THEN 'Affluent ($250K-$1M)'
      WHEN cs.total_relationship_value >= 50000   THEN 'Mass Affluent ($50K-$250K)'
      WHEN c.account_type = 'business'            THEN 'Small Business'
      ELSE 'Retail (<$50K)'
    END AS segment,
    COUNT(DISTINCT c.customer_id) AS customer_count,
    SUM(cs.annual_revenue) AS total_revenue,
    ROUND(AVG(cs.total_relationship_value), 0) AS avg_relationship,
    ROUND(AVG(cs.product_count), 1) AS avg_products
  FROM banking.customer_segments cs
  JOIN banking.customers c ON cs.customer_id = c.customer_id
  WHERE cs.snapshot_date = '2024-10-31'
    AND c.status = 'active'
  GROUP BY 1
)
SELECT
  segment,
  customer_count,
  ROUND(customer_count * 100.0 / SUM(customer_count) OVER (), 1) AS pct_of_base,
  total_revenue,
  avg_relationship,
  avg_products
FROM customer_segments
ORDER BY total_revenue DESC;`,
    dataSource: "core_banking_warehouse.customer_analytics",
    generationTime: 1.8
  },

  // ===== 11. Loan Growth Analysis =====
  {
    id: "loan_growth",
    title: "Loan Growth Analysis",
    triggerKeywords: ["loan growth", "disbursement", "loan disbursement", "new loans", "lending growth", "credit growth", "advances growth"],
    greeting: "Loan disbursement and repayment data is ready. I can analyze net growth, compare product segments, or show quarterly origination trends.",
    userQuestion: "How is loan growth trending? What are our disbursement and repayment patterns?",
    aiResponse: 'Net loan growth YTD is <strong>$2.8B</strong>, driven by <strong>$8.6B in new disbursements</strong> against $5.8B in repayments. <strong>Mortgages</strong> account for 55% of new originations at $4.7B. Q3 was the strongest quarter with <strong>$2.6B in net disbursements</strong>, boosted by the festive season home loan campaign. The loan book has grown from $25.6B to <span class="font-semibold text-primary">$28.4B</span>.',
    suggestions: [
      { label: "Loan portfolio mix", targetScenarioId: "loan_portfolio" },
      { label: "Asset quality impact", targetScenarioId: "npa_analysis" },
      { label: "Loan yield & pricing", targetScenarioId: "loan_yield" }
    ],
    insights: {
      cards: [
        { label: "Net Loan Growth", value: "$2.8B YTD (+10.9%)", detail: "Exceeding 8% annual growth target.", color: "emerald" },
        { label: "Total Disbursements", value: "$8.6B YTD", detail: "Mortgage origination at $4.7B leading all segments.", color: "blue" },
        { label: "Best Quarter", value: "Q3 — $2.6B Net", detail: "Home loan festival campaign drove record origination.", color: "amber" }
      ],
      bullets: [
        "Mortgage disbursements up 18% YoY with average ticket size of $320K.",
        "Commercial lending pipeline at $3.2B provides strong visibility for Q4.",
        "Auto loan growth moderated to 6% as higher rates impacted demand."
      ],
      confidence: 93
    },
    chart: {
      type: "bar",
      title: "Quarterly Disbursements vs Repayments",
      subtitle: "FY 2024 — in $B",
      labels: ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024 (Est)"],
      datasets: [
        {
          label: "New Disbursements",
          data: [1.9, 2.1, 2.6, 2.4],
          backgroundColor: "#fb4e0b",
          borderRadius: 4
        },
        {
          label: "Repayments",
          data: [1.3, 1.4, 1.5, 1.6],
          backgroundColor: "#94a3b8",
          borderRadius: 4
        }
      ],
      summaryStats: [
        { label: "Net Growth YTD", value: "$2.8B", color: "emerald" },
        { label: "Disbursement Rate", value: "+15% YoY", color: "slate" }
      ]
    },
    table: {
      headers: ["Quarter", "Disbursements", "Repayments", "Net Growth", "Book Size", "Growth %"],
      rows: [
        ["Q1 2024", "$1.9B", "$1.3B", "+$600M", "$26.2B", "+2.3%"],
        ["Q2 2024", "$2.1B", "$1.4B", "+$700M", "$26.9B", "+2.7%"],
        ["Q3 2024", "$2.6B", "$1.5B", "+$1.1B", "$28.0B", "+4.1%"],
        ["Q4 2024 (Est)", "$2.4B", "$1.6B", "+$800M", "$28.8B", "+2.9%"]
      ]
    },
    sql: `WITH quarterly_flows AS (
  SELECT
    DATE_TRUNC('quarter', transaction_date) AS quarter,
    SUM(CASE WHEN flow_type = 'disbursement' THEN amount ELSE 0 END) AS disbursements,
    SUM(CASE WHEN flow_type = 'repayment' THEN amount ELSE 0 END) AS repayments
  FROM banking.loan_disbursements
  WHERE transaction_date BETWEEN '2024-01-01' AND '2024-12-31'
  GROUP BY 1
),
book_size AS (
  SELECT
    DATE_TRUNC('quarter', snapshot_date) AS quarter,
    SUM(outstanding_balance) AS total_book
  FROM banking.loans
  WHERE snapshot_date IN ('2024-03-31', '2024-06-30', '2024-09-30', '2024-12-31')
  GROUP BY 1
)
SELECT
  f.quarter,
  ROUND(f.disbursements / 1e9, 1) AS disbursements_bn,
  ROUND(f.repayments / 1e9, 1) AS repayments_bn,
  ROUND((f.disbursements - f.repayments) / 1e9, 1) AS net_growth_bn,
  ROUND(b.total_book / 1e9, 1) AS book_size_bn
FROM quarterly_flows f
JOIN book_size b ON f.quarter = b.quarter
ORDER BY f.quarter;`,
    dataSource: "core_banking_warehouse.lending_analytics",
    generationTime: 1.5
  },

  // ===== 12. Loan Yield & Pricing =====
  {
    id: "loan_yield",
    title: "Loan Yield & Pricing",
    triggerKeywords: ["loan yield", "pricing", "interest rate", "yield curve", "loan pricing", "lending rate", "yield", "loan rates"],
    greeting: "Loan yield and pricing data is loaded with product-level breakdowns. I can show yield trends, compare product pricing, or analyze spread dynamics.",
    userQuestion: "What are our loan yields by product? How has pricing trended over the past year?",
    aiResponse: 'The blended loan portfolio yield is <strong>6.8%</strong>, up <strong>42bps YoY</strong> from 6.38%. <strong>Commercial loans</strong> carry the highest yield at <strong>8.2%</strong> reflecting risk-based pricing, while <strong>Mortgages</strong> yield 5.9% as competitive pressures keep rates tight. The yield expansion has been supported by the rising rate environment, with floating-rate loans repricing faster than fixed-rate maturities.',
    suggestions: [
      { label: "Net interest income", targetScenarioId: "nii_analysis" },
      { label: "Loan portfolio mix", targetScenarioId: "loan_portfolio" },
      { label: "Loan growth trends", targetScenarioId: "loan_growth" }
    ],
    insights: {
      cards: [
        { label: "Blended Yield", value: "6.80% (+42bps YoY)", detail: "Floating-rate repricing driving yield expansion.", color: "blue" },
        { label: "Highest Yield", value: "Commercial — 8.2%", detail: "Risk-adjusted pricing on $7.1B commercial book.", color: "emerald" },
        { label: "Spread to CoF", value: "3.45% NIM", detail: "Cost of funds at 3.35%, spread of 345bps.", color: "amber" }
      ],
      bullets: [
        "68% of the loan book is floating-rate, benefiting from the rising rate environment.",
        "Mortgage yield compressed 8bps in Q3 due to competitive refinancing pressure.",
        "Personal loan yield increased 65bps after risk-based pricing model was updated in Q2."
      ],
      confidence: 92
    },
    chart: {
      type: "line",
      title: "Loan Yield by Product",
      subtitle: "Nov 2023 - Oct 2024 — annualized yield %",
      yAxisFormat: "percent",
      labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
      datasets: [
        {
          label: "Commercial",
          data: [7.6, 7.7, 7.8, 7.8, 7.9, 8.0, 8.0, 8.1, 8.1, 8.2, 8.2, 8.2],
          borderColor: "#ef4444",
          fill: false,
          tension: 0.3
        },
        {
          label: "Personal",
          data: [9.8, 9.9, 10.0, 10.1, 10.2, 10.3, 10.4, 10.4, 10.5, 10.5, 10.5, 10.6],
          borderColor: "#8b5cf6",
          fill: false,
          tension: 0.3
        },
        {
          label: "Blended",
          data: [6.38, 6.42, 6.48, 6.52, 6.56, 6.60, 6.64, 6.68, 6.72, 6.76, 6.78, 6.80],
          borderColor: "#fb4e0b",
          backgroundColor: "rgba(251,78,11,0.08)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Mortgage",
          data: [5.7, 5.72, 5.75, 5.78, 5.80, 5.82, 5.85, 5.88, 5.88, 5.90, 5.90, 5.90],
          borderColor: "#10b981",
          fill: false,
          tension: 0.3
        }
      ],
      summaryStats: [
        { label: "Blended Yield", value: "6.80%", color: "slate" },
        { label: "YoY Change", value: "+42bps", color: "emerald" }
      ]
    },
    table: {
      headers: ["Product", "Current Yield", "Prior Year", "Change (bps)", "Book Size", "% Floating"],
      rows: [
        ["Personal Loans", "10.6%", "9.95%", "+65bps", "$2.84B", "45%"],
        ["Credit Cards", "18.2%", "17.8%", "+40bps", "$2.27B", "100%"],
        ["Commercial", "8.2%", "7.6%", "+60bps", "$7.10B", "82%"],
        ["Auto Loans", "7.4%", "7.0%", "+40bps", "$3.41B", "35%"],
        ["Mortgages", "5.9%", "5.7%", "+20bps", "$12.78B", "62%"],
        ["Blended", "6.80%", "6.38%", "+42bps", "$28.40B", "68%"]
      ]
    },
    sql: `WITH loan_yields AS (
  SELECT
    lp.product_name,
    ROUND(SUM(li.interest_accrued) * 12.0 * 100.0
      / NULLIF(AVG(l.outstanding_balance), 0), 2) AS current_yield,
    SUM(l.outstanding_balance) AS book_size,
    ROUND(
      COUNT(*) FILTER (WHERE l.rate_type = 'floating') * 100.0
      / COUNT(*), 0
    ) AS floating_pct
  FROM banking.loan_interest li
  JOIN banking.loans l ON li.loan_id = l.loan_id
  JOIN banking.loan_products lp ON l.product_id = lp.product_id
  WHERE li.accrual_month = '2024-10-01'
    AND l.status = 'active'
  GROUP BY lp.product_name
)
SELECT
  product_name,
  current_yield,
  book_size,
  floating_pct
FROM loan_yields
ORDER BY current_yield DESC;`,
    dataSource: "core_banking_warehouse.lending_analytics",
    generationTime: 1.6
  },

  // ===== 13. Provision Coverage Analysis =====
  {
    id: "provision_coverage",
    title: "Provision Coverage Analysis",
    triggerKeywords: ["provision", "provision coverage", "PCR", "loan loss", "allowance", "reserves", "ECL", "expected credit loss"],
    greeting: "Provision and ECL data is loaded with segment-level breakdowns. I can analyze coverage ratios, compare to regulatory requirements, or show trending.",
    userQuestion: "What is our provision coverage ratio? Are we adequately provisioned against NPAs?",
    aiResponse: 'Overall Provision Coverage Ratio (PCR) stands at <strong>145%</strong>, well above the <strong>100% regulatory minimum</strong>. Total provisions of <strong>$783M</strong> cover gross NPAs of $540M with a comfortable buffer. <strong>Mortgage provisions</strong> are at 180% reflecting conservative collateral assumptions, while <span class="font-semibold text-primary">commercial provisions at 125%</span> are being closely monitored given sector-specific risks.',
    suggestions: [
      { label: "NPA & asset quality", targetScenarioId: "npa_analysis" },
      { label: "Credit risk segments", targetScenarioId: "credit_risk_segments" },
      { label: "Executive KPI scorecard", targetScenarioId: "kpi_scorecard" }
    ],
    insights: {
      cards: [
        { label: "Overall PCR", value: "145%", detail: "45pp above 100% regulatory minimum.", color: "emerald" },
        { label: "Total Provisions", value: "$783M", detail: "Covering $540M in gross NPAs with $243M buffer.", color: "blue" },
        { label: "Lowest Coverage", value: "Commercial — 125%", detail: "Sector-specific CRE risk requires monitoring.", color: "amber" }
      ],
      bullets: [
        "ECL Stage 1 provisions of $220M cover performing loans at 0.8% average.",
        "Stage 3 provisions increased $45M in Q3 as a conservative measure for CRE exposure.",
        "Provision-to-loan ratio at 2.76% is the lowest in 3 years reflecting improving asset quality."
      ],
      confidence: 94
    },
    chart: {
      type: "bar",
      title: "Provision Coverage by Loan Category",
      subtitle: "As of Oct 2024 — provisions vs NPAs in $M",
      labels: ["Mortgages", "Commercial", "Auto", "Personal", "Cards"],
      datasets: [
        {
          label: "Provisions ($M)",
          data: [270, 250, 98, 95, 70],
          backgroundColor: "#fb4e0b",
          borderRadius: 4
        },
        {
          label: "Gross NPAs ($M)",
          data: [150, 200, 72, 68, 50],
          backgroundColor: "#ef4444",
          borderRadius: 4
        }
      ],
      summaryStats: [
        { label: "Overall PCR", value: "145%", color: "emerald" },
        { label: "Provision Buffer", value: "$243M", color: "slate" }
      ]
    },
    table: {
      headers: ["Category", "Provisions", "Gross NPAs", "PCR %", "ECL Stage", "QoQ Change"],
      rows: [
        ["Mortgages", "$270M", "$150M", "180%", "Stage 2: $85M", "+5pp"],
        ["Commercial", "$250M", "$200M", "125%", "Stage 3: $120M", "+2pp"],
        ["Auto Loans", "$98M", "$72M", "136%", "Stage 2: $42M", "+3pp"],
        ["Personal", "$95M", "$68M", "140%", "Stage 2: $38M", "+8pp"],
        ["Credit Cards", "$70M", "$50M", "140%", "Stage 1: $45M", "+4pp"]
      ]
    },
    sql: `SELECT
  lp.product_name AS category,
  ROUND(SUM(p.provision_balance) / 1e6, 0) AS provisions_mn,
  ROUND(SUM(CASE WHEN npa.npa_status = 'non_performing'
    THEN l.outstanding_balance ELSE 0 END) / 1e6, 0) AS gross_npa_mn,
  ROUND(
    SUM(p.provision_balance) * 100.0
    / NULLIF(SUM(CASE WHEN npa.npa_status = 'non_performing'
      THEN l.outstanding_balance ELSE 0 END), 0), 0
  ) AS pcr_pct
FROM banking.provisions p
JOIN banking.loans l ON p.loan_id = l.loan_id
JOIN banking.loan_products lp ON l.product_id = lp.product_id
LEFT JOIN banking.non_performing_assets npa ON l.loan_id = npa.loan_id
WHERE p.snapshot_date = '2024-10-31'
GROUP BY lp.product_name
ORDER BY provisions_mn DESC;`,
    dataSource: "core_banking_warehouse.risk_analytics",
    generationTime: 1.9
  },

  // ===== 14. Wealth Management AUM =====
  {
    id: "wealth_management",
    title: "Wealth Management AUM",
    triggerKeywords: ["wealth management", "AUM", "assets under management", "private banking", "wealth", "investment", "advisory"],
    greeting: "Wealth management data is loaded with AUM trends and flow analysis. I can show portfolio allocation, net flows, or client segmentation.",
    userQuestion: "What is our AUM? How are wealth management assets trending?",
    aiResponse: 'Assets Under Management have reached <strong>$18.5B</strong>, up <strong>15.6% YoY</strong> from $16.0B. <strong>Net inflows of $2.1B YTD</strong> demonstrate strong client confidence, while market appreciation contributed an additional $0.4B. The advisory mandate conversion rate has improved to <span class="font-semibold text-primary">28% from 19%</span>, driving higher fee margins on the growing AUM base.',
    suggestions: [
      { label: "Fee income breakdown", targetScenarioId: "fee_income" },
      { label: "Customer segmentation", targetScenarioId: "customer_segments" },
      { label: "KPI variance analysis", targetScenarioId: "kpi_vs_target" }
    ],
    insights: {
      cards: [
        { label: "Total AUM", value: "$18.5B (+15.6% YoY)", detail: "Highest AUM on record, driven by inflows and market gains.", color: "blue" },
        { label: "Net Inflows YTD", value: "$2.1B", detail: "Organic growth outpacing industry average of $1.2B.", color: "emerald" },
        { label: "Advisory Revenue", value: "$245M (+24% YoY)", detail: "Advisory mandate conversion at 28%, up from 19%.", color: "amber" }
      ],
      bullets: [
        "HNW client AUM of $12.8B represents 69% of total, growing at 18% YoY.",
        "Discretionary portfolios now represent 42% of AUM, up from 35%.",
        "ESG-focused mandates attracted $380M in new flows — fastest growing category."
      ],
      confidence: 91
    },
    chart: {
      type: "line",
      title: "AUM Trend & Net Flows",
      subtitle: "Nov 2023 - Oct 2024 — AUM in $B",
      labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
      datasets: [
        {
          label: "Total AUM",
          data: [16.0, 16.3, 16.5, 16.8, 17.0, 17.2, 17.5, 17.8, 18.0, 18.1, 18.3, 18.5],
          borderColor: "#fb4e0b",
          backgroundColor: "rgba(251,78,11,0.08)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Target",
          data: [16.0, 16.2, 16.4, 16.6, 16.8, 17.0, 17.2, 17.4, 17.6, 17.8, 18.0, 18.2],
          borderColor: "#94a3b8",
          borderDash: [8, 6],
          fill: false,
          tension: 0.3,
          pointRadius: 0
        }
      ],
      summaryStats: [
        { label: "Current AUM", value: "$18.5B", color: "slate" },
        { label: "Net Inflows YTD", value: "$2.1B", color: "emerald" }
      ]
    },
    table: {
      headers: ["Month", "AUM ($B)", "Net Flows ($M)", "Market Movement", "Advisory %", "MoM Change"],
      rows: [
        ["Nov 2023", "$16.0B", "$180M", "+$50M", "35%", "--"],
        ["Jan 2024", "$16.5B", "$220M", "+$30M", "36%", "+1.2%"],
        ["Apr 2024", "$17.2B", "$250M", "+$40M", "38%", "+1.2%"],
        ["Jul 2024", "$18.0B", "$280M", "+$60M", "40%", "+1.1%"],
        ["Sep 2024", "$18.3B", "$210M", "+$20M", "41%", "+1.1%"],
        ["Oct 2024", "$18.5B", "$240M", "+$30M", "42%", "+1.1%"]
      ]
    },
    sql: `WITH monthly_aum AS (
  SELECT
    DATE_TRUNC('month', snapshot_date) AS month,
    SUM(market_value) AS total_aum,
    SUM(CASE WHEN flow_type = 'inflow' THEN amount ELSE 0 END) -
    SUM(CASE WHEN flow_type = 'outflow' THEN amount ELSE 0 END) AS net_flows,
    SUM(market_movement) AS market_impact
  FROM banking.wealth_aum wa
  LEFT JOIN banking.wealth_flows wf ON wa.client_id = wf.client_id
    AND DATE_TRUNC('month', wa.snapshot_date) = DATE_TRUNC('month', wf.flow_date)
  WHERE wa.snapshot_date BETWEEN '2023-11-01' AND '2024-10-31'
  GROUP BY 1
)
SELECT
  month,
  ROUND(total_aum / 1e9, 1) AS aum_bn,
  ROUND(net_flows / 1e6, 0) AS net_flows_mn,
  ROUND(market_impact / 1e6, 0) AS market_mn
FROM monthly_aum
ORDER BY month;`,
    dataSource: "core_banking_warehouse.wealth_analytics",
    generationTime: 1.7
  },

  // ===== 15. Operational Efficiency =====
  {
    id: "operational_efficiency",
    title: "Operational Efficiency",
    triggerKeywords: ["efficiency", "cost to income", "operating efficiency", "cost ratio", "operational costs", "CIR", "cost income ratio"],
    greeting: "Operational efficiency data is loaded with cost-to-income trends and component breakdowns. I can analyze efficiency drivers, compare to targets, or benchmark against peers.",
    userQuestion: "How is our operational efficiency trending? What is the cost-to-income ratio?",
    aiResponse: 'The Cost-to-Income Ratio has improved from <strong>58% to 52%</strong> over the past 12 months, surpassing our <strong>55% target</strong> two quarters ahead of schedule. Key drivers include <strong>digital channel migration</strong> (saving $32M) and <strong>process automation</strong> (saving $18M). Revenue growth of 14% outpacing cost growth of 3% is the primary contributor to the <span class="font-semibold text-primary">6pp efficiency improvement</span>.',
    suggestions: [
      { label: "Branch performance", targetScenarioId: "branch_performance" },
      { label: "Digital adoption", targetScenarioId: "digital_adoption" },
      { label: "KPI variance analysis", targetScenarioId: "kpi_vs_target" }
    ],
    insights: {
      cards: [
        { label: "Cost-to-Income", value: "52% (↓ from 58%)", detail: "6pp improvement, now below 55% target.", color: "emerald" },
        { label: "Total Savings", value: "$50M Identified YTD", detail: "Digital migration ($32M) + automation ($18M).", color: "blue" },
        { label: "Revenue/Employee", value: "$385K (+12% YoY)", detail: "Productivity gains from digital transformation.", color: "amber" }
      ],
      bullets: [
        "Branch network optimization closed 12 underperforming branches, saving $8M annually.",
        "Robotic process automation deployed across 45 workflows, reducing manual processing by 60%.",
        "Cloud infrastructure migration completing Q4, projected to save $5M annually."
      ],
      confidence: 93
    },
    chart: {
      type: "line",
      title: "Cost-to-Income Ratio Trend",
      subtitle: "Nov 2023 - Oct 2024 — percentage",
      yAxisFormat: "percent",
      labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
      datasets: [
        {
          label: "CIR %",
          data: [58, 57.5, 57, 56.5, 56, 55.5, 55, 54.2, 53.5, 53, 52.5, 52],
          borderColor: "#fb4e0b",
          backgroundColor: "rgba(251,78,11,0.08)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Target (55%)",
          data: [55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55],
          borderColor: "#94a3b8",
          borderDash: [8, 6],
          fill: false,
          tension: 0,
          pointRadius: 0
        }
      ],
      summaryStats: [
        { label: "Current CIR", value: "52%", color: "emerald" },
        { label: "12-Mo Improvement", value: "-6pp", color: "slate" }
      ]
    },
    table: {
      headers: ["Month", "Revenue", "Operating Costs", "CIR %", "vs Target", "Savings"],
      rows: [
        ["Nov 2023", "$340M", "$197M", "58.0%", "+3.0pp above", "--"],
        ["Jan 2024", "$355M", "$202M", "57.0%", "+2.0pp above", "$2M"],
        ["Apr 2024", "$372M", "$207M", "55.5%", "+0.5pp above", "$8M"],
        ["Jul 2024", "$395M", "$211M", "53.5%", "-1.5pp below", "$15M"],
        ["Sep 2024", "$408M", "$214M", "52.5%", "-2.5pp below", "$20M"],
        ["Oct 2024", "$415M", "$216M", "52.0%", "-3.0pp below", "$22M"]
      ]
    },
    sql: `WITH monthly_efficiency AS (
  SELECT
    DATE_TRUNC('month', report_date) AS month,
    SUM(total_revenue) AS revenue,
    SUM(operating_expenses) AS opex
  FROM banking.revenue_summary rs
  JOIN banking.operating_costs oc
    ON DATE_TRUNC('month', rs.report_date) = DATE_TRUNC('month', oc.cost_date)
  WHERE report_date BETWEEN '2023-11-01' AND '2024-10-31'
  GROUP BY 1
)
SELECT
  month,
  ROUND(revenue / 1e6, 0) AS revenue_mn,
  ROUND(opex / 1e6, 0) AS opex_mn,
  ROUND(opex * 100.0 / revenue, 1) AS cost_to_income_pct
FROM monthly_efficiency
ORDER BY month;`,
    dataSource: "core_banking_warehouse.finance_analytics",
    generationTime: 1.4
  },

  // ===== 16. Treasury & Investment Portfolio =====
  {
    id: "treasury_operations",
    title: "Treasury & Investment Portfolio",
    triggerKeywords: ["treasury", "investment portfolio", "securities", "bonds", "treasury operations", "investment book", "government securities"],
    greeting: "Treasury investment portfolio data is loaded with allocation and yield metrics. I can analyze composition, duration management, or mark-to-market positions.",
    userQuestion: "What is our investment portfolio composition? How is the treasury book structured?",
    aiResponse: 'The <strong>$15.2B treasury investment portfolio</strong> is anchored by <strong>Government Securities at 40% ($6.1B)</strong>, ensuring high liquidity and SLR compliance. <strong>Corporate Bonds</strong> at 25% provide yield enhancement, while <strong>T-Bills at 15%</strong> serve as short-term liquidity buffers. The portfolio weighted average yield is <strong>4.85%</strong> with a modified duration of <span class="font-semibold text-primary">3.2 years</span>.',
    suggestions: [
      { label: "Net interest income", targetScenarioId: "nii_analysis" },
      { label: "Liquidity coverage", targetScenarioId: "liquidity_analysis" },
      { label: "Executive KPI scorecard", targetScenarioId: "kpi_scorecard" }
    ],
    insights: {
      cards: [
        { label: "Total Portfolio", value: "$15.2B", detail: "26% of total assets, within 25-30% policy range.", color: "blue" },
        { label: "Weighted Avg Yield", value: "4.85%", detail: "Up 35bps YoY from yield curve steepening.", color: "emerald" },
        { label: "Modified Duration", value: "3.2 Years", detail: "Within 2.5-4.0 year ALM target range.", color: "amber" }
      ],
      bullets: [
        "Govt Securities allocation at 40% exceeds SLR requirement of 18% with comfortable buffer.",
        "Corporate bond portfolio has AA average rating with no exposure below BBB.",
        "MBS portfolio of $1.8B hedged with interest rate swaps for duration management."
      ],
      confidence: 94
    },
    chart: {
      type: "doughnut",
      title: "Investment Portfolio Allocation",
      subtitle: "As of Oct 2024 — percentage of $15.2B portfolio",
      labels: ["Govt Securities", "Corporate Bonds", "T-Bills", "MBS", "Other"],
      datasets: [
        {
          label: "Allocation",
          data: [40, 25, 15, 12, 8],
          backgroundColor: ["#fb4e0b", "#10b981", "#f59e0b", "#8b5cf6", "#94a3b8"],
          borderWidth: 0,
          hoverOffset: 8
        }
      ],
      summaryStats: [
        { label: "Portfolio Size", value: "$15.2B", color: "slate" },
        { label: "Avg Yield", value: "4.85%", color: "emerald" }
      ]
    },
    table: {
      headers: ["Asset Class", "Value", "% of Portfolio", "Yield", "Duration (Yrs)", "Rating"],
      rows: [
        ["Govt Securities", "$6,080M", "40%", "4.50%", "4.2", "Sovereign"],
        ["Corporate Bonds", "$3,800M", "25%", "5.65%", "3.1", "AA Avg"],
        ["T-Bills", "$2,280M", "15%", "4.25%", "0.4", "Sovereign"],
        ["MBS", "$1,824M", "12%", "5.20%", "2.8", "AA+"],
        ["Other", "$1,216M", "8%", "4.90%", "2.5", "A+ Avg"]
      ]
    },
    sql: `SELECT
  s.asset_class,
  ROUND(SUM(s.market_value) / 1e6, 0) AS value_mn,
  ROUND(SUM(s.market_value) * 100.0
    / SUM(SUM(s.market_value)) OVER (), 1) AS pct_of_portfolio,
  ROUND(AVG(s.yield_to_maturity), 2) AS avg_ytm,
  ROUND(AVG(s.modified_duration), 1) AS avg_duration,
  MODE() WITHIN GROUP (ORDER BY s.credit_rating) AS modal_rating
FROM treasury.investment_portfolio s
JOIN treasury.securities sec ON s.security_id = sec.security_id
WHERE s.snapshot_date = '2024-10-31'
GROUP BY s.asset_class
ORDER BY value_mn DESC;`,
    dataSource: "core_banking_warehouse.treasury_analytics",
    generationTime: 1.5
  },

  // ===== 17. Liquidity Coverage Analysis =====
  {
    id: "liquidity_analysis",
    title: "Liquidity Coverage Analysis",
    triggerKeywords: ["liquidity", "LCR", "NSFR", "liquidity coverage", "liquidity ratio", "liquid assets", "funding"],
    greeting: "Liquidity metrics are loaded including LCR and NSFR trends. I can analyze coverage adequacy, stress scenarios, or funding composition.",
    userQuestion: "What are our liquidity ratios? Are we meeting regulatory requirements?",
    aiResponse: 'The <strong>Liquidity Coverage Ratio (LCR)</strong> stands at <strong>142%</strong>, comfortably above the <strong>100% regulatory minimum</strong>. The <strong>Net Stable Funding Ratio (NSFR)</strong> is at <strong>118%</strong>, also well above requirements. High-quality liquid assets (HQLA) total <span class="font-semibold text-primary">$8.9B</span>, providing a robust buffer. Both ratios have improved over the past 4 quarters as deposit growth strengthened the funding base.',
    suggestions: [
      { label: "Treasury portfolio", targetScenarioId: "treasury_operations" },
      { label: "Deposit portfolio", targetScenarioId: "deposit_overview" },
      { label: "Regulatory compliance", targetScenarioId: "regulatory_compliance" }
    ],
    insights: {
      cards: [
        { label: "LCR", value: "142% (Req: 100%)", detail: "42pp buffer above regulatory minimum.", color: "emerald" },
        { label: "NSFR", value: "118% (Req: 100%)", detail: "Stable funding profile supports long-term lending.", color: "blue" },
        { label: "HQLA", value: "$8.9B", detail: "Level 1 assets at $6.8B, Level 2 at $2.1B.", color: "amber" }
      ],
      bullets: [
        "LCR improved 12pp over the past year driven by deposit growth and HQLA accumulation.",
        "30-day net cash outflow modeled at $6.3B under stress — $2.6B buffer in HQLA.",
        "Wholesale funding dependency reduced from 28% to 22% of total liabilities."
      ],
      confidence: 95
    },
    chart: {
      type: "bar",
      title: "LCR & NSFR Quarterly Trend",
      subtitle: "Q1 2024 - Q4 2024 (Est) — percentage",
      yAxisFormat: "percent",
      labels: ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024 (Est)"],
      datasets: [
        {
          label: "LCR",
          data: [128, 133, 138, 142],
          backgroundColor: "#fb4e0b",
          borderRadius: 4
        },
        {
          label: "NSFR",
          data: [110, 113, 116, 118],
          backgroundColor: "#10b981",
          borderRadius: 4
        },
        {
          label: "Regulatory Min (100%)",
          data: [100, 100, 100, 100],
          type: "line",
          borderColor: "#ef4444",
          borderDash: [8, 6],
          backgroundColor: "transparent",
          tension: 0,
          pointRadius: 0,
          borderWidth: 2
        }
      ],
      summaryStats: [
        { label: "Current LCR", value: "142%", color: "emerald" },
        { label: "Current NSFR", value: "118%", color: "slate" }
      ]
    },
    table: {
      headers: ["Quarter", "LCR %", "NSFR %", "HQLA ($B)", "Net Outflows ($B)", "Buffer ($B)"],
      rows: [
        ["Q1 2024", "128%", "110%", "$7.8B", "$6.1B", "$1.7B"],
        ["Q2 2024", "133%", "113%", "$8.2B", "$6.2B", "$2.0B"],
        ["Q3 2024", "138%", "116%", "$8.6B", "$6.2B", "$2.4B"],
        ["Q4 2024 (Est)", "142%", "118%", "$8.9B", "$6.3B", "$2.6B"]
      ]
    },
    sql: `WITH quarterly_liquidity AS (
  SELECT
    DATE_TRUNC('quarter', metric_date) AS quarter,
    AVG(lcr_ratio) * 100 AS avg_lcr,
    AVG(nsfr_ratio) * 100 AS avg_nsfr,
    AVG(hqla_total) AS avg_hqla,
    AVG(net_cash_outflow_30d) AS avg_outflows
  FROM banking.liquidity_metrics
  WHERE metric_date BETWEEN '2024-01-01' AND '2024-12-31'
  GROUP BY 1
)
SELECT
  quarter,
  ROUND(avg_lcr, 0) AS lcr_pct,
  ROUND(avg_nsfr, 0) AS nsfr_pct,
  ROUND(avg_hqla / 1e9, 1) AS hqla_bn,
  ROUND(avg_outflows / 1e9, 1) AS outflows_bn,
  ROUND((avg_hqla - avg_outflows) / 1e9, 1) AS buffer_bn
FROM quarterly_liquidity
ORDER BY quarter;`,
    dataSource: "core_banking_warehouse.treasury_analytics",
    generationTime: 1.6
  },

  // ===== 18. Regulatory Compliance Dashboard =====
  {
    id: "regulatory_compliance",
    title: "Regulatory Compliance Dashboard",
    triggerKeywords: ["regulatory", "compliance", "capital adequacy", "CAR", "CET1", "Tier 1", "Basel", "regulatory ratios", "capital ratio"],
    greeting: "Regulatory capital and compliance data is loaded. I can show capital adequacy ratios, compare to minimums, or analyze the capital structure.",
    userQuestion: "Are we meeting all regulatory capital requirements? What are our key regulatory ratios?",
    aiResponse: '<strong>All key regulatory ratios exceed minimum requirements</strong> with comfortable buffers. <strong>CET1 ratio</strong> is at <strong>13.2%</strong> against a 7% minimum (including buffers), <strong>Tier 1 Capital</strong> at 14.8% vs 8.5% requirement, and <strong>Total Capital Adequacy</strong> at 17.1% vs 10.5% minimum. The <span class="font-semibold text-primary">Leverage Ratio of 6.8%</span> also exceeds the 3% minimum by a wide margin.',
    suggestions: [
      { label: "Liquidity coverage", targetScenarioId: "liquidity_analysis" },
      { label: "Provision coverage", targetScenarioId: "provision_coverage" },
      { label: "Executive KPI scorecard", targetScenarioId: "kpi_scorecard" }
    ],
    insights: {
      cards: [
        { label: "CET1 Ratio", value: "13.2% (Min: 7.0%)", detail: "6.2pp buffer — strong capital position.", color: "emerald" },
        { label: "Total CAR", value: "17.1% (Min: 10.5%)", detail: "Supports growth without capital raising.", color: "blue" },
        { label: "Leverage Ratio", value: "6.8% (Min: 3.0%)", detail: "More than 2x the regulatory minimum.", color: "amber" }
      ],
      bullets: [
        "CET1 improved 40bps YoY through retained earnings of $1.2B.",
        "Risk-weighted assets grew 8% to $42.5B, slower than asset growth of 11%.",
        "Countercyclical buffer fully met at 0.5% — no additional capital charge required."
      ],
      confidence: 96
    },
    chart: {
      type: "bar",
      indexAxis: "y",
      xAxisFormat: "percent",
      title: "Regulatory Ratios vs Minimums",
      subtitle: "As of Oct 2024 — all ratios in percentage",
      labels: ["CET1 Ratio", "Tier 1 Capital", "Total CAR", "Leverage Ratio", "LCR", "NSFR"],
      datasets: [
        {
          label: "Actual",
          data: [13.2, 14.8, 17.1, 6.8, 142, 118],
          backgroundColor: "#fb4e0b",
          borderRadius: 4
        },
        {
          label: "Regulatory Min",
          data: [7.0, 8.5, 10.5, 3.0, 100, 100],
          backgroundColor: "#ef444466",
          borderRadius: 4
        }
      ],
      summaryStats: [
        { label: "CET1 Buffer", value: "+6.2pp", color: "emerald" },
        { label: "Total CAR", value: "17.1%", color: "slate" }
      ]
    },
    table: {
      headers: ["Ratio", "Actual", "Regulatory Min", "Buffer", "YoY Change", "Status"],
      rows: [
        ["CET1 Ratio", "13.2%", "7.0%", "+6.2pp", "+0.4pp", "Exceeding"],
        ["Tier 1 Capital", "14.8%", "8.5%", "+6.3pp", "+0.3pp", "Exceeding"],
        ["Total CAR", "17.1%", "10.5%", "+6.6pp", "+0.5pp", "Exceeding"],
        ["Leverage Ratio", "6.8%", "3.0%", "+3.8pp", "+0.2pp", "Exceeding"],
        ["LCR", "142%", "100%", "+42pp", "+12pp", "Exceeding"],
        ["NSFR", "118%", "100%", "+18pp", "+8pp", "Exceeding"]
      ]
    },
    sql: `SELECT
  rm.ratio_name,
  ROUND(rm.actual_value, 1) AS actual_pct,
  ROUND(rm.regulatory_minimum, 1) AS min_pct,
  ROUND(rm.actual_value - rm.regulatory_minimum, 1) AS buffer_pp,
  ROUND(rm.actual_value - rm.prior_year_value, 1) AS yoy_change,
  CASE
    WHEN rm.actual_value >= rm.regulatory_minimum * 1.2 THEN 'Exceeding'
    WHEN rm.actual_value >= rm.regulatory_minimum THEN 'On Track'
    ELSE 'Below Minimum'
  END AS status
FROM banking.regulatory_metrics rm
JOIN banking.capital_ratios cr ON rm.ratio_id = cr.ratio_id
WHERE rm.report_date = '2024-10-31'
ORDER BY rm.actual_value - rm.regulatory_minimum DESC;`,
    dataSource: "core_banking_warehouse.regulatory_reporting",
    generationTime: 1.3
  },

  // ===== 19. Executive KPI Scorecard =====
  {
    id: "kpi_scorecard",
    title: "Executive KPI Scorecard",
    triggerKeywords: ["KPI", "scorecard", "executive summary", "dashboard", "key metrics", "performance summary", "overview", "executive"],
    greeting: "The executive KPI scorecard is loaded with actual vs target performance. I can drill into any specific metric or show trend analysis.",
    userQuestion: "Give me the executive KPI scorecard. How are we performing against targets?",
    aiResponse: '<strong>5 of 6 key KPIs are meeting or exceeding targets</strong>. <strong>ROE at 14.8%</strong> exceeds the 13% target, <strong>NIM at 3.45%</strong> is above the 3.30% plan, and <strong>NPA ratio at 1.9%</strong> is well below the 2.5% ceiling. The only metric slightly behind is <strong>Cost-to-Income at 52%</strong> vs a 50% stretch target — though it has already surpassed the initial <span class="font-semibold text-primary">55% target</span> set at the start of the year.',
    suggestions: [
      { label: "Net interest income detail", targetScenarioId: "nii_analysis" },
      { label: "Deposit portfolio", targetScenarioId: "deposit_overview" },
      { label: "KPI variance analysis", targetScenarioId: "kpi_vs_target" }
    ],
    insights: {
      cards: [
        { label: "KPIs On Track", value: "5 of 6 Meeting Target", detail: "Only Cost-to-Income slightly behind stretch goal.", color: "emerald" },
        { label: "ROE", value: "14.8% (Target: 13%)", detail: "Strong profitability driven by NII growth and efficiency.", color: "blue" },
        { label: "NPA Ratio", value: "1.9% (Ceiling: 2.5%)", detail: "Asset quality at 5-year best, 60bps below ceiling.", color: "amber" }
      ],
      bullets: [
        "ROE outperformance driven by NII growth of 14% and fee income growth of 18%.",
        "Deposit growth of 12% exceeding 10% target, supporting funding stability.",
        "Cost-to-Income at 52% — exceeded initial 55% target but 2pp above 50% stretch."
      ],
      confidence: 95
    },
    chart: {
      type: "bar",
      title: "KPI Scorecard: Actual vs Target",
      subtitle: "FY 2024 — key banking performance metrics",
      labels: ["ROE %", "NIM %", "NPA %", "CIR %", "Deposit Growth %", "Loan Growth %"],
      datasets: [
        {
          label: "Actual",
          data: [14.8, 3.45, 1.9, 52, 12, 10.9],
          backgroundColor: "#fb4e0b",
          borderRadius: 4
        },
        {
          label: "Target",
          data: [13, 3.30, 2.5, 50, 10, 8],
          backgroundColor: "#94a3b8",
          borderRadius: 4
        }
      ],
      summaryStats: [
        { label: "On Target", value: "5 of 6", color: "emerald" },
        { label: "ROE", value: "14.8%", color: "slate" }
      ]
    },
    table: {
      headers: ["KPI", "Actual", "Target", "Variance", "Status", "Trend"],
      rows: [
        ["Return on Equity", "14.8%", "13.0%", "+1.8pp", "Exceeding", "Increasing"],
        ["Net Interest Margin", "3.45%", "3.30%", "+0.15pp", "Exceeding", "Increasing"],
        ["Gross NPA Ratio", "1.9%", "<2.5%", "-0.6pp", "Exceeding", "Stable"],
        ["Cost-to-Income", "52%", "50%", "+2.0pp", "At Risk", "Declining"],
        ["Deposit Growth", "12.0%", "10.0%", "+2.0pp", "Exceeding", "Increasing"],
        ["Loan Growth", "10.9%", "8.0%", "+2.9pp", "Exceeding", "Increasing"]
      ]
    },
    sql: `SELECT
  ka.kpi_name,
  ROUND(ka.actual_value, 2) AS actual,
  ROUND(kt.target_value, 2) AS target,
  ROUND(ka.actual_value - kt.target_value, 2) AS variance,
  CASE
    WHEN ka.kpi_name = 'Gross NPA Ratio' AND ka.actual_value <= kt.target_value THEN 'Exceeding'
    WHEN ka.kpi_name = 'Cost-to-Income' AND ka.actual_value <= kt.target_value THEN 'Exceeding'
    WHEN ka.kpi_name NOT IN ('Gross NPA Ratio', 'Cost-to-Income')
      AND ka.actual_value >= kt.target_value THEN 'Exceeding'
    ELSE 'At Risk'
  END AS status
FROM banking.kpi_actuals ka
JOIN banking.kpi_targets kt ON ka.kpi_id = kt.kpi_id
WHERE ka.report_date = '2024-10-31'
  AND kt.fiscal_year = 2024
ORDER BY ka.kpi_id;`,
    dataSource: "core_banking_warehouse.executive_reporting",
    generationTime: 2.1
  },

  // ===== 20. KPI Variance Analysis =====
  {
    id: "kpi_vs_target",
    title: "KPI Variance Analysis",
    triggerKeywords: ["KPI variance", "target vs actual", "performance gap", "variance", "ahead of target", "behind target", "metrics vs target"],
    greeting: "KPI variance data is loaded with detailed breakdowns. I can show where we're exceeding or trailing plan, along with root cause analysis.",
    userQuestion: "Show me a detailed variance analysis. Where are we ahead and behind our targets?",
    aiResponse: 'The variance analysis shows a <strong>predominantly positive picture</strong>. <strong>Deposit growth leads at +2.0pp</strong> above target (12% vs 10%), while <strong>NII is $180M above plan</strong> (+6%). <strong>Fee income</strong> is the standout at <strong>+$90M (+11.3%)</strong> above target. The only areas trailing are <strong>Cost-to-Income</strong> (-2pp behind stretch target) and <strong>customer acquisition</strong> slightly below the 50K target at <span class="font-semibold text-primary">45,200 YTD</span>.',
    suggestions: [
      { label: "KPI scorecard overview", targetScenarioId: "kpi_scorecard" },
      { label: "Net interest income", targetScenarioId: "nii_analysis" },
      { label: "Operational efficiency", targetScenarioId: "operational_efficiency" }
    ],
    insights: {
      cards: [
        { label: "Positive Variances", value: "7 of 10 KPIs Above", detail: "Broad-based outperformance across revenue and risk metrics.", color: "emerald" },
        { label: "Biggest Beat", value: "Fee Income +$90M (+11.3%)", detail: "Trade finance and wealth management driving upside.", color: "blue" },
        { label: "Biggest Miss", value: "New Accounts -4,800 (-9.6%)", detail: "Branch acquisition channel underperforming target.", color: "rose" }
      ],
      bullets: [
        "Revenue-related KPIs broadly ahead of plan, supported by rate environment and volume growth.",
        "Risk metrics showing favorable variance — NPA 60bps better than 2.5% ceiling.",
        "Customer acquisition miss concentrated in branch channel; digital exceeding sub-target by 12%."
      ],
      confidence: 92
    },
    chart: {
      type: "bar",
      title: "KPI Variance from Target",
      subtitle: "FY 2024 — positive (green) = ahead of target, negative (red) = behind",
      labels: ["NII", "Fee Income", "Deposit Growth", "Loan Growth", "NPA Ratio", "ROE", "NIM", "AUM Growth", "CIR", "New Accounts"],
      datasets: [
        {
          label: "Variance %",
          data: [6.0, 11.3, 2.0, 2.9, 0.6, 1.8, 0.15, 1.6, -2.0, -9.6],
          backgroundColor: ["#10b981", "#10b981", "#10b981", "#10b981", "#10b981", "#10b981", "#10b981", "#10b981", "#ef4444", "#ef4444"],
          borderRadius: 4
        }
      ],
      summaryStats: [
        { label: "Above Target", value: "8 of 10", color: "emerald" },
        { label: "Below Target", value: "2 of 10", color: "rose" }
      ]
    },
    table: {
      headers: ["KPI", "Target", "Actual", "Variance", "Variance %", "Status"],
      rows: [
        ["Net Interest Income", "$3.02B", "$3.20B", "+$180M", "+6.0%", "Exceeding"],
        ["Fee Income", "$800M", "$890M", "+$90M", "+11.3%", "Exceeding"],
        ["Deposit Growth", "10.0%", "12.0%", "+2.0pp", "+20%", "Exceeding"],
        ["Loan Growth", "8.0%", "10.9%", "+2.9pp", "+36%", "Exceeding"],
        ["NPA Ratio", "<2.5%", "1.9%", "-0.6pp", "Favorable", "Exceeding"],
        ["ROE", "13.0%", "14.8%", "+1.8pp", "+14%", "Exceeding"],
        ["NIM", "3.30%", "3.45%", "+0.15pp", "+5%", "Exceeding"],
        ["AUM Growth", "14%", "15.6%", "+1.6pp", "+11%", "Exceeding"],
        ["Cost-to-Income", "50%", "52%", "+2.0pp", "+4%", "At Risk"],
        ["New Accounts", "50,000", "45,200", "-4,800", "-9.6%", "At Risk"]
      ]
    },
    sql: `WITH kpi_variance AS (
  SELECT
    ka.kpi_name,
    kt.target_value,
    ka.actual_value,
    ka.actual_value - kt.target_value AS variance_abs,
    ROUND(
      (ka.actual_value - kt.target_value) * 100.0
      / NULLIF(kt.target_value, 0), 1
    ) AS variance_pct,
    CASE
      WHEN ka.kpi_name IN ('Gross NPA Ratio', 'Cost-to-Income')
        AND ka.actual_value <= kt.target_value THEN 'Exceeding'
      WHEN ka.kpi_name NOT IN ('Gross NPA Ratio', 'Cost-to-Income')
        AND ka.actual_value >= kt.target_value THEN 'Exceeding'
      ELSE 'At Risk'
    END AS status
  FROM banking.kpi_actuals ka
  JOIN banking.kpi_targets kt ON ka.kpi_id = kt.kpi_id
  WHERE ka.report_date = '2024-10-31'
    AND kt.fiscal_year = 2024
)
SELECT *
FROM kpi_variance
ORDER BY
  CASE status WHEN 'Exceeding' THEN 1 ELSE 2 END,
  ABS(variance_pct) DESC;`,
    dataSource: "core_banking_warehouse.executive_reporting",
    generationTime: 2.0
  },

  // ===== Bonus: Customer Attrition =====
  {
    id: "customer_attrition",
    title: "Customer Attrition Analysis",
    triggerKeywords: ["attrition", "customer attrition", "churn", "customer churn", "account closure", "lost customers", "customer loss"],
    greeting: "Customer attrition data is loaded with reason analysis and segment breakdowns. I can show trends, identify drivers, or analyze prevention effectiveness.",
    userQuestion: "What is our customer attrition rate? What are the main reasons customers are leaving?",
    aiResponse: 'Monthly attrition has <strong>declined from 0.42% to 0.28%</strong> over the past year, representing a <strong>33% reduction in churn</strong>. The annualized attrition rate is now <strong>3.4%</strong>, down from 5.0%. Top reasons are <strong>pricing/fees (32%)</strong>, competitor offers (24%), and relocation (18%). The proactive retention program has saved <span class="font-semibold text-primary">$180M in at-risk deposits</span> YTD.',
    suggestions: [
      { label: "Customer segments", targetScenarioId: "customer_segments" },
      { label: "Customer acquisition", targetScenarioId: "customer_acquisition" },
      { label: "Digital adoption", targetScenarioId: "digital_adoption" }
    ],
    insights: {
      cards: [
        { label: "Monthly Attrition", value: "0.28% (↓ from 0.42%)", detail: "33% reduction in churn rate over 12 months.", color: "emerald" },
        { label: "Annualized Rate", value: "3.4% (was 5.0%)", detail: "Best attrition rate in 4 years.", color: "blue" },
        { label: "Deposits Saved", value: "$180M via Retention", detail: "Proactive outreach program saving 42% of at-risk accounts.", color: "amber" }
      ],
      bullets: [
        "Pricing/fees remain the #1 reason (32%) — loyalty pricing program reducing this by 15%.",
        "HNW attrition at 0.8% annualized — lowest across all segments.",
        "Retention offer acceptance rate improved from 28% to 42% after personalization in Q2."
      ],
      confidence: 90
    },
    chart: {
      type: "line",
      title: "Monthly Attrition Rate Trend",
      subtitle: "Nov 2023 - Oct 2024 — percentage of active customers",
      yAxisFormat: "percent",
      labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
      datasets: [
        {
          label: "Attrition Rate",
          data: [0.42, 0.40, 0.38, 0.37, 0.36, 0.35, 0.34, 0.32, 0.31, 0.30, 0.29, 0.28],
          borderColor: "#fb4e0b",
          backgroundColor: "rgba(251,78,11,0.08)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Target (0.30%)",
          data: [0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30],
          borderColor: "#94a3b8",
          borderDash: [8, 6],
          fill: false,
          tension: 0,
          pointRadius: 0
        }
      ],
      summaryStats: [
        { label: "Current Rate", value: "0.28%", color: "emerald" },
        { label: "12-Mo Improvement", value: "-0.14pp", color: "slate" }
      ]
    },
    table: {
      headers: ["Reason", "% of Attrition", "Accounts Lost", "Deposits Lost", "Trend", "Mitigation"],
      rows: [
        ["Pricing/Fees", "32%", "2,180", "$420M", "Declining", "Loyalty pricing"],
        ["Competitor Offer", "24%", "1,635", "$380M", "Stable", "Match program"],
        ["Relocation", "18%", "1,225", "$195M", "Stable", "Digital retention"],
        ["Service Issues", "14%", "953", "$142M", "Declining", "CX improvement"],
        ["Life Events", "8%", "545", "$85M", "Stable", "Proactive outreach"],
        ["Other", "4%", "272", "$38M", "Stable", "Monitoring"]
      ]
    },
    sql: `WITH attrition_analysis AS (
  SELECT
    DATE_TRUNC('month', closure_date) AS month,
    closure_reason,
    COUNT(*) AS accounts_closed,
    SUM(balance_at_closure) AS deposits_lost
  FROM banking.account_closures ac
  JOIN banking.customers c ON ac.customer_id = c.customer_id
  WHERE closure_date BETWEEN '2023-11-01' AND '2024-10-31'
  GROUP BY 1, 2
)
SELECT
  closure_reason,
  ROUND(SUM(accounts_closed) * 100.0
    / SUM(SUM(accounts_closed)) OVER (), 0) AS pct_of_attrition,
  SUM(accounts_closed) AS total_closed,
  ROUND(SUM(deposits_lost) / 1e6, 0) AS deposits_lost_mn
FROM attrition_analysis
GROUP BY closure_reason
ORDER BY total_closed DESC;`,
    dataSource: "core_banking_warehouse.customer_analytics",
    generationTime: 1.5
  }
];

// ===== Keyword Matching =====
function getScenarioByKeywords(input) {
  const normalizedInput = input.toLowerCase().trim();
  let bestMatch = null;
  let bestScore = 0;

  for (const scenario of SCENARIOS) {
    let score = 0;
    for (const keyword of scenario.triggerKeywords) {
      if (normalizedInput.includes(keyword.toLowerCase())) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = scenario;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

function getScenarioById(id) {
  return SCENARIOS.find(s => s.id === id) || null;
}
