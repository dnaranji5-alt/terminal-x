import React, { useState, useEffect, useMemo, useRef } from 'react';

const API_KEY = 'gEZA1HnJ4wGa3bbLcjBluU43hr3T8GKs';
const BASE_URL = 'https://financialmodelingprep.com/stable';

const Icons = {
  Search: (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Activity: (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  AlertCircle: (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  TrendingUp: (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
};

const safeNum = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
};

const getField = (obj, keys) => {
  if (!obj) return null;
  for (const k of keys) {
    const val = safeNum(obj[k] ?? obj[k.toLowerCase()] ?? obj[k.toUpperCase()]);
    if (val !== null) return val;
  }
  return null;
};

const formatCompact = (num, isCurrency = true) => {
  if (num === null || num === undefined) return 'N/A';
  if (num === 'NM') return 'NM';
  const isNeg = num < 0;
  const absNum = Math.abs(num);
  let formatted = '';
  if (absNum >= 1e12) formatted = `${(absNum / 1e12).toFixed(2)}T`;
  else if (absNum >= 1e9) formatted = `${(absNum / 1e9).toFixed(2)}B`;
  else if (absNum >= 1e6) formatted = `${(absNum / 1e6).toFixed(2)}M`;
  else formatted = `${absNum.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
  
  const prefix = isCurrency ? '$' : '';
  return isNeg ? `-${prefix}${formatted}` : `${prefix}${formatted}`;
};

const formatPercent = (num) => {
  if (num === null || num === undefined) return 'N/A';
  if (num === 'NM') return 'NM';
  return `${(Number(num) * 100).toFixed(2)}%`;
};

const NativeChart = ({ 
  data, 
  primaryKey, 
  secondaryKey, 
  tertiaryKey, 
  quaternaryKey, 
  type = 'bar', 
  primaryColor = '#3b82f6', 
  secondaryColor = '#10b981', 
  tertiaryColor = '#f59e0b', 
  quaternaryColor = '#a855f7', 
  formatter = formatCompact, 
  isCurrency = true 
}) => {
  if (!data || data.length === 0) return <div className="text-slate-500 flex items-center justify-center h-full text-xs font-medium">No data available</div>;

  const allVals = [
      ...data.map(d => d[primaryKey]),
      ...(secondaryKey ? data.map(d => d[secondaryKey]) : []),
      ...(tertiaryKey ? data.map(d => d[tertiaryKey]) : []),
      ...(quaternaryKey ? data.map(d => d[quaternaryKey]) : [])
  ].map(v => safeNum(v)).filter(v => v !== null);
  
  if (allVals.length === 0) return <div className="text-slate-500 flex items-center justify-center h-full text-xs font-medium">No valid numerical data</div>;

  let actualMax = Math.max(...allVals);
  let actualMin = Math.min(...allVals);
  
  if (type === 'bar') {
      actualMax = Math.max(actualMax, 0);
      actualMin = Math.min(actualMin, 0);
  }
  
  if (actualMax === actualMin) { actualMax += 1; actualMin -= 1; }
  
  const range = actualMax - actualMin;
  const zeroPos = ((0 - actualMin) / range) * 100;
  const xDenom = Math.max(1, data.length - 1);
  const showZeroLine = actualMin < 0 && actualMax > 0;

  const renderPath = (key, color, strokeWidth, dash) => {
      let d = '';
      let isFirst = true;
      data.forEach((item, i) => {
          const val = safeNum(item[key]);
          if (val === null) {
              isFirst = true;
          } else {
              const x = (i / xDenom) * 100;
              const y = 100 - (((val - actualMin) / range) * 100);
              d += isFirst ? `M ${x} ${y} ` : `L ${x} ${y} `;
              isFirst = false;
          }
      });
      return d ? (
          <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={dash} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      ) : null;
  };

  const renderTooltipValue = (valRaw) => {
      if (valRaw === 'NM') return 'NM';
      const num = safeNum(valRaw);
      return num !== null ? formatter(num, isCurrency) : 'N/A';
  };

  return (
      <div className="w-full h-full relative flex items-end justify-between pt-6 pb-6 gap-0 group/chart">
          <div className="absolute top-0 left-0 text-[10px] font-mono text-slate-500">{formatter(actualMax, isCurrency)}</div>
          <div className="absolute bottom-0 left-0 text-[10px] font-mono text-slate-500">{formatter(actualMin, isCurrency)}</div>

          {data.map((d, i) => {
              const pValRaw = d[primaryKey];
              const pVal = pValRaw === 'NM' ? null : safeNum(pValRaw);
              const sVal = secondaryKey ? safeNum(d[secondaryKey]) : null;
              const tVal = tertiaryKey ? safeNum(d[tertiaryKey]) : null;
              const qVal = quaternaryKey ? safeNum(d[quaternaryKey]) : null;

              const isLeftEdge = i < data.length * 0.2;
              const isRightEdge = i > data.length * 0.8;
              const tooltipPosition = isLeftEdge ? 'left-0' : isRightEdge ? 'right-0' : 'left-1/2 -translate-x-1/2';

              let barHeight = 0;
              let barBottom = 'auto';
              let isNegative = false;

              if (pVal !== null) {
                  const valuePos = ((pVal - actualMin) / range) * 100;
                  if (valuePos >= zeroPos) {
                      barBottom = `${zeroPos}%`;
                      barHeight = Math.max(1, valuePos - zeroPos);
                  } else {
                      barBottom = `${valuePos}%`;
                      barHeight = Math.max(1, zeroPos - valuePos);
                      isNegative = true;
                  }
              }

              return (
                  <div key={i} className="relative flex-1 flex flex-col justify-end h-full z-10 hover:bg-slate-700/30 transition-colors rounded group/bar cursor-crosshair">
                      {type === 'bar' && pVal !== null && (
                          <div
                              className={`w-[90%] mx-auto ${isNegative ? 'rounded-b-sm bg-rose-500/80' : 'rounded-t-sm'} transition-all group-hover/bar:brightness-125`}
                              style={{
                                  height: `${barHeight}%`,
                                  backgroundColor: !isNegative ? primaryColor : undefined,
                                  position: 'absolute',
                                  bottom: barBottom,
                                  left: '5%',
                                  right: '5%'
                              }}
                          />
                      )}
                      
                      <div className={`absolute bottom-full mb-3 ${tooltipPosition} bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl opacity-0 group-hover/bar:opacity-100 pointer-events-none z-50 whitespace-nowrap`}>
                          <p className="text-slate-300 font-bold text-[11px] mb-2 border-b border-slate-700 pb-1 flex items-center justify-between gap-4">
                              <span>Period</span>
                              <span className="text-blue-400 font-mono">{d.date}</span>
                          </p>
                          {(pVal !== null || pValRaw === 'NM') && (
                              <p className="text-[11px] font-mono flex items-center justify-between gap-4" style={{color: primaryColor}}>
                                  <span className="font-semibold">{primaryKey}:</span>
                                  <span className="font-bold">{renderTooltipValue(pValRaw)}</span>
                              </p>
                          )}
                          {secondaryKey && sVal !== null && (
                              <p className="text-[11px] font-mono mt-1 flex items-center justify-between gap-4" style={{color: secondaryColor}}>
                                  <span className="font-semibold">{secondaryKey}:</span>
                                  <span className="font-bold">{formatter(sVal, isCurrency)}</span>
                              </p>
                          )}
                          {tertiaryKey && tVal !== null && (
                              <p className="text-[11px] font-mono mt-1 flex items-center justify-between gap-4" style={{color: tertiaryColor}}>
                                  <span className="font-semibold">{tertiaryKey}:</span>
                                  <span className="font-bold">{formatter(tVal, isCurrency)}</span>
                              </p>
                          )}
                          {quaternaryKey && qVal !== null && (
                              <p className="text-[11px] font-mono mt-1 flex items-center justify-between gap-4" style={{color: quaternaryColor}}>
                                  <span className="font-semibold">{quaternaryKey}:</span>
                                  <span className="font-bold">{formatter(qVal, isCurrency)}</span>
                              </p>
                          )}
                      </div>
                  </div>
              );
          })}

          {(type === 'line' || secondaryKey) && (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full z-20 pointer-events-none pb-6 pt-6 overflow-visible">
                  {type === 'line' && renderPath(primaryKey, primaryColor, "2", "")}
                  {secondaryKey && renderPath(secondaryKey, secondaryColor, "1.5", "3 3")}
                  {tertiaryKey && renderPath(tertiaryKey, tertiaryColor, "1.5", "5 3")}
                  {quaternaryKey && renderPath(quaternaryKey, quaternaryColor, "1.5", "7 3")}
              </svg>
          )}
          
          {showZeroLine && <div className="absolute w-full border-t border-slate-600 border-dashed z-0" style={{ bottom: `${zeroPos}%` }} />}
      </div>
  );
};

function FinancialEngine() {
  const [ticker, setTicker] = useState('AAPL');
  const [searchInput, setSearchInput] = useState('AAPL');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [data, setData] = useState({
    income: [], balance: [], cash: [], metrics: [], price: [], quote: [], insider: [], errors: []
  });

  const abortControllerRef = useRef(null);

  const fetchAllData = async (symbol) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setData({ income: [], balance: [], cash: [], metrics: [], price: [], quote: [], insider: [], errors: [] });
    setLoading(true);
    setError(null);

    try {
      const sym = symbol.toUpperCase();
      const limit = '&limit=40'; 
      
      const endpoints = {
        quote: `${BASE_URL}/quote?symbol=${sym}&apikey=${API_KEY}`,
        income: `${BASE_URL}/income-statement?symbol=${sym}&period=quarter${limit}&apikey=${API_KEY}`,
        balance: `${BASE_URL}/balance-sheet-statement?symbol=${sym}&period=quarter${limit}&apikey=${API_KEY}`,
        cash: `${BASE_URL}/cash-flow-statement?symbol=${sym}&period=quarter${limit}&apikey=${API_KEY}`,
        metrics: `${BASE_URL}/key-metrics?symbol=${sym}&period=quarter${limit}&apikey=${API_KEY}`,
        price: `${BASE_URL}/historical-price-eod/full?symbol=${sym}&apikey=${API_KEY}`,
        insider: `${BASE_URL}/insider-trading/search?symbol=${sym}&limit=100&apikey=${API_KEY}`
      };

      const fetchPromises = Object.entries(endpoints).map(async ([key, url]) => {
        try {
          const res = await fetch(url, { signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          
          if (json && (json['Error Message'] || json.error || json.message)) {
            throw new Error(json['Error Message'] || json.error || json.message);
          }

          let parsedData = [];
          if (Array.isArray(json)) parsedData = json;
          else if (json && json.historical && Array.isArray(json.historical)) parsedData = json.historical;
          else if (json && typeof json === 'object') parsedData = [json]; 
          return { key, data: parsedData, error: null };
        } catch (err) {
          if (err.name === 'AbortError') throw err;
          return { key, data: [], error: err.message }; 
        }
      });

      const results = await Promise.all(fetchPromises);
      const newData = { errors: [] };
      results.forEach(res => { 
        newData[res.key] = res.data; 
        if (res.error) newData.errors.push(`${res.key}: ${res.error}`);
      });
      
      if (newData.income.length === 0 && newData.quote.length === 0) {
        throw new Error('Critical data missing. Verify ticker symbol or API connection.');
      }
      
      setData(newData);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(ticker);
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, [ticker]);

  const analysis = useMemo(() => {
    try {
      const sortAsc = (arr) => [...(arr || [])].filter(x => x && x.date).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const incomeAsc = sortAsc(data.income);
      const balanceAsc = sortAsc(data.balance);
      const cashAsc = sortAsc(data.cash);
      const metricsAsc = sortAsc(data.metrics);
      const priceAsc = sortAsc(data.price);

      const quoteObj = data.quote[0] || {};
      const currentPrice = getField(quoteObj, ['price', 'lastPrice', 'close']);
      const currentCap = getField(quoteObj, ['marketCap', 'marketcap']);

      let ttmEps = null;
      let calculatedPe = null;

      if (incomeAsc.length >= 4) {
          const qLatest = incomeAsc[incomeAsc.length - 1];
          const qOldest = incomeAsc[incomeAsc.length - 4];
          const daysDiff = (new Date(qLatest.date) - new Date(qOldest.date)) / (1000 * 3600 * 24);
          
          if (daysDiff > 250 && daysDiff < 320) {
              let netIncomeSum = 0;
              let weightedSharesSum = 0;
              let totalDays = 0;
              let validQuarters = true;

              for(let i = 1; i <= 4; i++) {
                  const q = incomeAsc[incomeAsc.length - i];
                  const qPrev = incomeAsc[incomeAsc.length - i - 1];
                  const days = qPrev ? (new Date(q.date) - new Date(qPrev.date)) / (1000 * 3600 * 24) : 91.25;

                  const ni = getField(q, ['netIncome', 'netincome']);
                  const sh = getField(q, ['weightedAverageShsOutDil']);
                  if (ni === null || sh === null) {
                      validQuarters = false;
                      break;
                  }
                  netIncomeSum += ni;
                  weightedSharesSum += (sh * days);
                  totalDays += days;
              }

              if (validQuarters && totalDays > 0) {
                  const ttmNetIncome = netIncomeSum;
                  const ttmDilutedShares = weightedSharesSum / totalDays;
                  if (currentPrice !== null && ttmDilutedShares > 0) {
                      ttmEps = ttmNetIncome / ttmDilutedShares;
                      if (ttmEps > 0) calculatedPe = currentPrice / ttmEps;
                  }
              }
          }
      }
      
      const finalPE = calculatedPe;

      const calcOperatingIC = (b) => {
          if (!b) return null;
          const assets = getField(b, ['totalAssets', 'totalassets']);
          const cash = getField(b, ['cashAndCashEquivalents', 'cash']);
          const stInvestments = getField(b, ['shortTermInvestments', 'marketableSecurities']);
          const totCL = getField(b, ['totalCurrentLiabilities', 'currentliabilities']);
          const stDebt = getField(b, ['shortTermDebt', 'shorttermdebt']);
          
          if (assets === null || cash === null || stInvestments === null || totCL === null || stDebt === null) return null;
          
          const operatingCL = Math.max(0, totCL - stDebt);
          const ic = assets - cash - stInvestments - operatingCL;
          return ic > 0 ? ic : null;
      };

      const roicHistory = [];
      for (let i = 3; i < incomeAsc.length; i++) {
          const currentInc = incomeAsc[i];
          const targetDate = currentInc.date;
          const endingDateObj = new Date(targetDate);

          let ttmOpInc = 0, ttmTax = 0, ttmPreTax = 0;
          let validTtm = true;

          const qOldest = incomeAsc[i - 3];
          const daysDiff = (endingDateObj - new Date(qOldest.date)) / (1000 * 3600 * 24);
          if (daysDiff < 250 || daysDiff > 320) continue; 

          for(let j = 0; j < 4; j++) {
              const qInc = incomeAsc[i-j];
              const opInc = getField(qInc, ['operatingIncome', 'operatingincome']);
              const tax = getField(qInc, ['incomeTaxExpense', 'taxexpense']);
              const preTax = getField(qInc, ['incomeBeforeTax', 'pretaxincome']);

              if (opInc === null || tax === null || preTax === null) {
                  validTtm = false; break;
              }
              ttmOpInc += opInc; ttmTax += tax; ttmPreTax += preTax;
          }

          if (!validTtm) continue;

          let effectiveTaxRate = null;
          if (ttmPreTax > 0 && ttmTax >= 0) {
              const rawTaxRate = ttmTax / ttmPreTax;
              if (rawTaxRate >= 0 && rawTaxRate <= 0.50) {
                  effectiveTaxRate = rawTaxRate;
              }
          }

          if (effectiveTaxRate === null) continue;
          
          const nopat = ttmOpInc * (1 - effectiveTaxRate);

          const endingBal = [...balanceAsc].reverse().find(b => new Date(b.date) <= endingDateObj);
          
          const targetPrevDateMs = endingDateObj.getTime() - (365 * 24 * 3600 * 1000);
          let beginningBal = null;
          let minDiff = Infinity;
          for (const b of balanceAsc) {
              const bDateMs = new Date(b.date).getTime();
              const diff = Math.abs(bDateMs - targetPrevDateMs);
              if (diff < minDiff && diff < (45 * 24 * 3600 * 1000)) { 
                  minDiff = diff;
                  beginningBal = b;
              }
          }

          if (endingBal && beginningBal) {
              const beginningIC = calcOperatingIC(beginningBal);
              const endingIC = calcOperatingIC(endingBal);
              const avgIC = (beginningIC !== null && endingIC !== null) ? (beginningIC + endingIC) / 2 : null;
              
              if (avgIC !== null && avgIC > 1000000) { 
                  roicHistory.push({
                      date: targetDate,
                      'ROIC (%)': (nopat / avgIC) * 100
                  });
              }
          }
      }

      const currentRoic = roicHistory.length > 0 ? roicHistory[roicHistory.length - 1]['ROIC (%)'] / 100 : null;

      let ttmFCF = null;
      let calculatedFcfMargin = null;
      let fcfGrowth = null;
      let validFcf = false;

      if (cashAsc.length > 0 && incomeAsc.length >= 4) {
          let tempTtmFCF = 0;
          let tempTtmRev = 0;
          validFcf = true;
          for(let i = 0; i < 4; i++) {
              const targetDate = incomeAsc[incomeAsc.length - 1 - i].date;
              const targetDateMs = new Date(targetDate).getTime();
              const rev = getField(incomeAsc[incomeAsc.length - 1 - i], ['revenue']);
              
              let qCash = null;
              let minDiff = Infinity;
              for (const c of cashAsc) {
                  const cMs = new Date(c.date).getTime();
                  const diff = Math.abs(cMs - targetDateMs);
                  if (diff < minDiff && diff <= 45 * 86400000) {
                      minDiff = diff;
                      qCash = c;
                  }
              }
              
              if (!qCash) { validFcf = false; break; }
              
              const ocf = getField(qCash, ['operatingCashFlow']);
              const capex = getField(qCash, ['capitalExpenditure']);
              if (ocf === null || capex === null || rev === null) { validFcf = false; break; }
              
              tempTtmFCF += (ocf - Math.abs(capex));
              tempTtmRev += rev;
          }
          if (validFcf) {
              ttmFCF = tempTtmFCF;
              if (tempTtmRev > 0) calculatedFcfMargin = ttmFCF / tempTtmRev;
          }
      }

      const calculatedFcfYield = (currentCap !== null && currentCap > 0 && validFcf) ? ttmFCF / currentCap : null;

      const technicalData = [];
      let latestRsi = null, latestSma20 = null, latestSma50 = null, latestSma200 = null;

      if (priceAsc.length > 0) {
        let validPriceSeries = priceAsc.map(x => ({
            date: x.date,
            close: getField(x, ['adjClose', 'close', 'price'])
        })).filter(x => x.close !== null);

        let prevAvgGain = 0, prevAvgLoss = 0, sumGains = 0, sumLosses = 0;
        let consecutiveValidChanges = 0;
        
        for (let i = 0; i < validPriceSeries.length; i++) {
          const p = validPriceSeries[i].close;
          
          let sma20 = null, sma50 = null, sma200 = null;
          if (i >= 19) sma20 = validPriceSeries.slice(i - 19, i + 1).reduce((s, x) => s + x.close, 0) / 20;
          if (i >= 49) sma50 = validPriceSeries.slice(i - 49, i + 1).reduce((s, x) => s + x.close, 0) / 50;
          if (i >= 199) sma200 = validPriceSeries.slice(i - 199, i + 1).reduce((s, x) => s + x.close, 0) / 200;

          let currentRsi = null;
          if (i > 0) {
              const prevP = validPriceSeries[i-1].close;
              const change = p - prevP;
              let gain = change > 0 ? change : 0;
              let loss = change < 0 ? -change : 0;
              
              consecutiveValidChanges++;

              if (consecutiveValidChanges <= 14) {
                sumGains += gain; sumLosses += loss;
                if (consecutiveValidChanges === 14) {
                  prevAvgGain = sumGains / 14;
                  prevAvgLoss = sumLosses / 14;
                  currentRsi = prevAvgLoss === 0 ? 100 : 100 - (100 / (1 + (prevAvgGain / prevAvgLoss)));
                }
              } else {
                const avgGain = (prevAvgGain * 13 + gain) / 14;
                const avgLoss = (prevAvgLoss * 13 + loss) / 14;
                currentRsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));
                prevAvgGain = avgGain; prevAvgLoss = avgLoss;
              }
          }

          technicalData.push({
            date: validPriceSeries[i].date, Price: p, '20D SMA': sma20, '50D SMA': sma50, '200D SMA': sma200, RSI: currentRsi
          });
        }
        
        const lastTech = technicalData[technicalData.length - 1];
        latestRsi = lastTech?.RSI ?? null;
        latestSma20 = lastTech?.['20D SMA'] ?? null;
        latestSma50 = lastTech?.['50D SMA'] ?? null;
        latestSma200 = lastTech?.['200D SMA'] ?? null;
      }

      const latestIncData = incomeAsc[incomeAsc.length - 1] || {};
      const latestMetricsData = metricsAsc[metricsAsc.length - 1] || {};

      let latestRevYoY = null;
      if (incomeAsc.length >= 5) {
          const currentRev = getField(latestIncData, ['revenue']);
          const prevYearInc = incomeAsc.find(x => {
              if (latestIncData.calendarYear && latestIncData.period && x.calendarYear && x.period) {
                  return String(x.calendarYear) === String(Number(latestIncData.calendarYear) - 1) && x.period === latestIncData.period;
              }
              const diff = (new Date(latestIncData.date) - new Date(x.date)) / 86400000;
              return diff >= 340 && diff <= 400;
          });
          
          if (prevYearInc) {
              const prevRev = getField(prevYearInc, ['revenue']);
              if (currentRev !== null && prevRev !== null && prevRev > 0) {
                  latestRevYoY = (currentRev - prevRev) / prevRev;
              }
          }
      }

      const netDebtHistory = balanceAsc.map(d => {
          const debt = getField(d, ['totalDebt']);
          const cash = getField(d, ['cashAndCashEquivalents']);
          const st = getField(d, ['shortTermInvestments']);
          const netDebt = (debt !== null && cash !== null && st !== null) ? debt - cash - st : null;
          return { date: d.date, 'Net Debt': netDebt };
      });

      const peHistory = incomeAsc.map(inc => {
          const fullIdx = incomeAsc.indexOf(inc);
          let pe = null;
          if (fullIdx >= 3) {
              let ttmNetIncome = 0;
              let ttmShares = 0;
              let valid = true;
              for(let i=0; i<4; i++) {
                  const q = incomeAsc[fullIdx - i];
                  const ni = getField(q, ['netIncome']);
                  const sh = getField(q, ['weightedAverageShsOutDil']);
                  if (ni === null || sh === null) valid = false;
                  ttmNetIncome += ni || 0;
                  ttmShares += sh || 0;
              }
              const ttmEps = valid && ttmShares > 0 ? ttmNetIncome / (ttmShares / 4) : null;
              
              let matchedPrice = null;
              const targetMs = new Date(inc.date).getTime();
              let minDiff = Infinity;
              for (const p of priceAsc) {
                  const diff = Math.abs(new Date(p.date).getTime() - targetMs);
                  if (diff < minDiff && diff <= 45 * 86400000) {
                      minDiff = diff;
                      matchedPrice = getField(p, ['adjClose', 'close', 'price']);
                  }
              }
              
              if (matchedPrice !== null && ttmEps !== null && ttmEps > 0) {
                  pe = matchedPrice / ttmEps;
              }
          }
          return {
              date: inc.date,
              'PE Ratio': pe !== null ? (pe > 300 ? 'NM' : pe) : null
          };
      });

      const psHistory = incomeAsc.map(inc => {
          const fullIdx = incomeAsc.indexOf(inc);
          let ps = null;
          if (fullIdx >= 3) {
              let ttmRev = 0;
              let ttmShares = 0;
              let valid = true;
              for(let i=0; i<4; i++) {
                  const q = incomeAsc[fullIdx - i];
                  const rev = getField(q, ['revenue']);
                  const sh = getField(q, ['weightedAverageShsOutDil']);
                  if (rev === null || sh === null) valid = false;
                  ttmRev += rev || 0;
                  ttmShares += sh || 0;
              }
              const ttmSalesPerShare = valid && ttmShares > 0 ? ttmRev / (ttmShares / 4) : null;
              
              let matchedPrice = null;
              const targetMs = new Date(inc.date).getTime();
              let minDiff = Infinity;
              for (const p of priceAsc) {
                  const diff = Math.abs(new Date(p.date).getTime() - targetMs);
                  if (diff < minDiff && diff <= 45 * 86400000) {
                      minDiff = diff;
                      matchedPrice = getField(p, ['adjClose', 'close', 'price']);
                  }
              }
              
              if (matchedPrice !== null && ttmSalesPerShare !== null && ttmSalesPerShare > 0) {
                  ps = matchedPrice / ttmSalesPerShare;
              }
          }
          return {
              date: inc.date,
              'PS Ratio': ps !== null ? (ps > 300 ? 'NM' : ps) : null
          };
      });

      const insiderData = (data.insider || []).slice(0, 15).map((tx, idx) => ({
          id: tx.id || idx,
          date: tx.transactionDate || tx.date || 'N/A',
          name: tx.reportingName || tx.name || 'Unknown',
          type: tx.transactionType || tx.acquistionOrDisposition || tx.type || 'N/A',
          amount: tx.securitiesTransacted || tx.amount || tx.shares || 0,
          price: tx.price || tx.pricePerShare || 0
      }));

      return {
        currentPrice, currentCap, finalPE, currentRoic, roicHistory, calculatedFcfYield,
        ttmFCF, calculatedFcfMargin,
        technicals: { chartData: technicalData.slice(-250), latestRsi, latestSma20, latestSma50, latestSma200 },
        latestMetrics: latestMetricsData, latestRevYoY, latestInc: latestIncData,
        netDebtHistory: netDebtHistory.slice(-16), peHistory: peHistory.slice(-16), psHistory: psHistory.slice(-16),
        insiderData,
        incomeAsc, cashAsc, priceAsc
      };
    } catch (err) {
      console.error("Analysis Error:", err);
      return {
        currentPrice: null, currentCap: null, finalPE: null, currentRoic: null, roicHistory: [], calculatedFcfYield: null,
        ttmFCF: null, calculatedFcfMargin: null,
        technicals: { chartData: [] },
        latestMetrics: {}, latestRevYoY: null, latestInc: {},
        netDebtHistory: [], peHistory: [], psHistory: [],
        insiderData: [],
        incomeAsc: [], cashAsc: [], priceAsc: []
      };
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 sm:p-8 selection:bg-blue-500/30 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-md">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Icons.TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              Terminal X
            </h1>
            <p className="text-slate-400 text-sm mt-1 ml-11 font-medium">High-Level Equity Dashboard</p>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center gap-6 w-full sm:w-auto">
            <form onSubmit={(e) => { e.preventDefault(); if(searchInput.trim()) setTicker(searchInput.trim().toUpperCase()); }} className="relative w-full sm:w-64">
              <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value.toUpperCase())} placeholder="Search Ticker (e.g., AAPL)"
                className="w-full bg-slate-950 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold uppercase tracking-wider text-sm transition-all"
              />
            </form>
          </div>
        </header>

        {/* Status Indicators */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
            <p className="text-blue-400 font-bold text-sm tracking-widest uppercase animate-pulse">Aggregating Global Markets...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-6 rounded-2xl flex items-start gap-4">
            <Icons.AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-rose-400 font-bold text-base">Engine Exception</h3>
              <p className="text-rose-300/80 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && !error && analysis.currentPrice !== null && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            
            {/* Top Level Quote */}
            <div className="flex flex-col sm:flex-row items-baseline gap-4 sm:gap-6 px-2">
              <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter">${analysis.currentPrice.toFixed(2)}</h2>
              <div className="flex items-center gap-3">
                <span className="text-xl sm:text-2xl font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">{ticker}</span>
                <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">Live</span>
              </div>
            </div>

            {/* Core Metrics Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Market Cap', val: formatCompact(analysis.currentCap), color: 'text-white' },
                { label: 'P/E (TTM)', val: analysis.finalPE ? analysis.finalPE.toFixed(2) : 'N/A', color: 'text-blue-400' },
                { label: 'ROIC (Operating)', val: formatPercent(analysis.currentRoic), color: 'text-emerald-400' },
                { label: 'FCF Yield', val: formatPercent(analysis.calculatedFcfYield), color: 'text-emerald-400' },
                { label: 'Rev Growth (YoY)', val: formatPercent(analysis.latestRevYoY), color: 'text-white' },
                { label: 'RSI (14D)', val: analysis.technicals.latestRsi ? analysis.technicals.latestRsi.toFixed(1) : 'N/A', color: analysis.technicals.latestRsi < 30 ? 'text-emerald-400' : analysis.technicals.latestRsi > 70 ? 'text-rose-400' : 'text-slate-300' },
              ].map((metric, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg hover:border-slate-700 transition-colors">
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-2">{metric.label}</p>
                  <p className={`text-xl sm:text-2xl font-black ${metric.color}`}>{metric.val}</p>
                </div>
              ))}
            </div>

            {/* Main Price Chart */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Icons.Activity className="w-5 h-5 text-blue-500" /> Price Action & Technicals
                </h3>
                <div className="flex gap-4 text-xs font-bold bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
                  <span className="flex items-center gap-1.5 text-white"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Price</span>
                  <span className="flex items-center gap-1.5 text-slate-400"><div className="w-2 h-2 rounded-full bg-blue-500"></div>20D SMA</span>
                  <span className="flex items-center gap-1.5 text-slate-400 hidden sm:flex"><div className="w-2 h-2 rounded-full bg-amber-500"></div>50D SMA</span>
                  <span className="flex items-center gap-1.5 text-slate-400 hidden sm:flex"><div className="w-2 h-2 rounded-full bg-purple-500"></div>200D SMA</span>
                </div>
              </div>
              <div className="flex-1 min-h-0 bg-slate-950/50 rounded-xl border border-slate-800 p-4">
                <NativeChart 
                  data={analysis.technicals.chartData} 
                  primaryKey="Price" secondaryKey="20D SMA" tertiaryKey="50D SMA" quaternaryKey="200D SMA"
                  type="line" primaryColor="#10b981" secondaryColor="#3b82f6" tertiaryColor="#f59e0b" quaternaryColor="#a855f7"
                />
              </div>
            </div>

            {/* Fundamental Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Revenue & Income */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col h-[350px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white font-bold text-lg">Top & Bottom Line</h3>
                  <div className="flex gap-3 text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-slate-300"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Revenue</span>
                    <span className="flex items-center gap-1.5 text-slate-300"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Net Inc</span>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <NativeChart 
                    data={analysis.incomeAsc.slice(-16).map(d => ({ 
                      date: d.date, 
                      Revenue: getField(d, ['revenue']),
                      'Net Income': getField(d, ['netIncome']) 
                    }))} 
                    primaryKey="Revenue" secondaryKey="Net Income"
                    type="bar" primaryColor="#3b82f6" secondaryColor="#10b981"
                  />
                </div>
              </div>

              {/* Free Cash Flow */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col h-[350px]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-white font-bold text-lg">Free Cash Flow Generation</h3>
                    <p className="text-slate-500 text-xs mt-1">Operating Cash Flow minus CapEx</p>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <NativeChart 
                    data={analysis.cashAsc.slice(-16).map(d => {
                      const ocf = getField(d, ['operatingCashFlow']);
                      const capex = getField(d, ['capitalExpenditure']);
                      const fcf = (ocf !== null && capex !== null) ? ocf - Math.abs(capex) : null;
                      return { date: d.date, 'Free Cash Flow': fcf };
                    })} 
                    primaryKey="Free Cash Flow" 
                    type="bar" primaryColor="#8b5cf6" 
                  />
                </div>
              </div>

            </div>

            {}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Net Debt */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col h-[350px] lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-white font-bold text-lg">Net Debt</h3>
                    <p className="text-slate-500 text-xs mt-1">Total Debt minus Cash & ST Investments</p>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <NativeChart 
                    data={analysis.netDebtHistory} 
                    primaryKey="Net Debt" 
                    type="bar" primaryColor="#f43f5e" 
                  />
                </div>
              </div>

              {/* Historical P/S */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col h-[350px]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-white font-bold text-lg">Historical P/S Ratio (TTM)</h3>
                    <p className="text-slate-500 text-xs mt-1">Price to Trailing 12M Sales</p>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <NativeChart 
                    data={analysis.psHistory} 
                    primaryKey="PS Ratio" 
                    type="line" primaryColor="#ec4899" 
                    formatter={(v) => Number(v).toFixed(2)} 
                    isCurrency={false} 
                  />
                </div>
              </div>

              {/* Historical P/E */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col h-[350px]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-white font-bold text-lg">Historical P/E Ratio (TTM)</h3>
                    <p className="text-slate-500 text-xs mt-1">Price to Trailing 12M Earnings</p>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <NativeChart 
                    data={analysis.peHistory} 
                    primaryKey="PE Ratio" 
                    type="line" primaryColor="#a855f7" 
                    formatter={(v) => Number(v).toFixed(1)} 
                    isCurrency={false} 
                  />
                </div>
              </div>

            </div>

            {}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-white font-bold text-lg">Recent Insider Transactions</h3>
                  <p className="text-slate-500 text-xs mt-1">Latest reported trades by company management and directors</p>
                </div>
              </div>
              <div className="overflow-x-auto bg-slate-950/50 rounded-xl border border-slate-800">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                   <thead className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                     <tr>
                       <th className="p-4">Date</th>
                       <th className="p-4">Insider Name</th>
                       <th className="p-4">Type</th>
                       <th className="p-4 text-right">Shares</th>
                       <th className="p-4 text-right">Price</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800">
                     {analysis.insiderData.length === 0 ? (
                        <tr><td colSpan="5" className="p-8 text-center text-slate-500 text-sm font-medium">No recent transactions found.</td></tr>
                     ) : analysis.insiderData.map((tx) => {
                        const typeStr = String(tx.type).toUpperCase();
                        const isBuy = typeStr.includes('P-PURCHASE') || typeStr === 'P' || typeStr === 'A' || typeStr.includes('BUY');
                        const isSell = typeStr.includes('S-SALE') || typeStr === 'S' || typeStr === 'D' || typeStr.includes('SELL');
                        return (
                            <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                               <td className="p-4 text-sm text-slate-400 font-mono">{tx.date}</td>
                               <td className="p-4 text-sm text-white font-medium">{tx.name}</td>
                               <td className="p-4 text-sm">
                                 <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isBuy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : isSell ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                   {tx.type}
                                 </span>
                               </td>
                               <td className="p-4 text-sm text-right text-slate-300 font-mono">{safeNum(tx.amount) !== null ? tx.amount.toLocaleString() : '—'}</td>
                               <td className="p-4 text-sm text-right text-slate-300 font-mono">{safeNum(tx.price) !== null && tx.price > 0 ? `$${Number(tx.price).toFixed(2)}` : '—'}</td>
                            </tr>
                        )
                     })}
                   </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center text-slate-200">
          <div className="bg-rose-900/20 border border-rose-500/30 p-8 rounded-3xl max-w-xl w-full shadow-2xl backdrop-blur-sm">
            <h1 className="text-xl font-bold text-rose-400 mb-2 flex items-center gap-3">
              <Icons.AlertCircle className="w-6 h-6" /> System Exception
            </h1>
            <p className="text-slate-400 mb-6 text-sm">A critical fault occurred in the rendering pipeline.</p>
            <div className="bg-black/80 p-4 rounded-xl font-mono text-rose-300/80 text-xs overflow-x-auto whitespace-pre-wrap border border-rose-500/10 shadow-inner">
              {this.state.error?.toString()}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return <ErrorBoundary><FinancialEngine /></ErrorBoundary>;
}
