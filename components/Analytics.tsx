import React, { useState, useCallback } from 'react';
import { Session, PaymentStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';

interface AnalyticsProps {
  sessions: Session[];
}

const PaymentStatusTR: Record<PaymentStatus, string> = {
  [PaymentStatus.PAID]: 'Ödendi',
  [PaymentStatus.WAITING]: 'Beklemede',
  [PaymentStatus.CANCELLED]: 'İptal Edildi',
};

const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
  
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-semibold">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${value} Seans`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {`(${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
};

const Analytics: React.FC<AnalyticsProps> = ({ sessions }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = useCallback((_: any, index: number) => {
      setActiveIndex(index);
  }, [setActiveIndex]);

  if (sessions.length === 0) {
    return null;
  }

  // 1. Payment Status Distribution Data
  const paymentStatusData = Object.values(PaymentStatus).map(status => ({
    name: PaymentStatusTR[status],
    value: sessions.filter(s => s.paymentStatus === status).length,
  })).filter(item => item.value > 0);

  const COLORS: Record<PaymentStatus, string> = {
    [PaymentStatus.PAID]: '#10B981', // green-500
    [PaymentStatus.WAITING]: '#F59E0B', // amber-500
    [PaymentStatus.CANCELLED]: '#EF4444', // red-500
  };
  const pieColors = Object.values(PaymentStatus).map(status => COLORS[status]);

  // 2. Monthly Income Data
  const monthlyIncome = sessions.reduce((acc, session) => {
    if (session.paymentStatus === PaymentStatus.PAID) {
      const monthYear = new Date(session.sessionDate).toLocaleDateString('tr-TR', { year: '2-digit', month: 'short' });
      acc[monthYear] = (acc[monthYear] || 0) + session.sessionFee;
    }
    return acc;
  }, {} as Record<string, number>);

  const monthlyIncomeData = Object.keys(monthlyIncome).map(key => ({
    name: key,
    Gelir: monthlyIncome[key],
  })).sort((a, b) => {
      const monthMap: { [key: string]: number } = { 'Oca': 0, 'Şub': 1, 'Mar': 2, 'Nis': 3, 'May': 4, 'Haz': 5, 'Tem': 6, 'Ağu': 7, 'Eyl': 8, 'Eki': 9, 'Kas': 10, 'Ara': 11 };
      const [monthAStr, yearA] = a.name.split(' ');
      const [monthBStr, yearB] = b.name.split(' ');
      const monthA = monthMap[monthAStr];
      const monthB = monthMap[monthBStr];
      const dateA = new Date(parseInt(yearA, 10) + 2000, monthA);
      const dateB = new Date(parseInt(yearB, 10) + 2000, monthB);
      return dateA.getTime() - dateB.getTime();
  });

  // 3. Session Frequency Per Patient
  const patientFrequency = sessions.reduce((acc, session) => {
    if (session.paymentStatus !== PaymentStatus.CANCELLED) {
      acc[session.patientName] = (acc[session.patientName] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const patientFrequencyData = Object.keys(patientFrequency)
    .map(name => ({ name, Seans: patientFrequency[name] }))
    .sort((a, b) => b.Seans - a.Seans)
    .slice(0, 10); // Top 10 patients
  
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Veri Görselleştirme</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Ödeme Durumu Dağılımı</h3>
          {paymentStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    fill="#0d9488"
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                >
                    {paymentStatusData.map((entry, index) => {
                        const statusKey = Object.keys(PaymentStatusTR).find(key => PaymentStatusTR[key as PaymentStatus] === entry.name) as PaymentStatus;
                        return <Cell key={`cell-${index}`} fill={COLORS[statusKey]} />;
                    })}
                </Pie>
                <Tooltip formatter={(value) => `${value} seans`} />
                </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-500 py-24">Grafik için veri yok.</p>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Danışan Başına Seans Sayısı (Top 10)</h3>
          {patientFrequencyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={patientFrequencyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => `${value} seans`} />
                <Legend />
                <Bar dataKey="Seans" fill="#0d9488" />
                </BarChart>
            </ResponsiveContainer>
          ): <p className="text-center text-gray-500 py-24">Grafik için veri yok.</p>}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Aylık Gelir (Ödenen Seanslar)</h3>
           {monthlyIncomeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyIncomeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `₺${value}`} />
                <Tooltip formatter={(value) => `₺${(value as number).toFixed(2)}`} />
                <Legend />
                <Bar dataKey="Gelir" fill="#14b8a6" />
                </BarChart>
            </ResponsiveContainer>
          ): <p className="text-center text-gray-500 py-24">Grafik için veri yok.</p>}
        </div>
      </div>
    </div>
  );
};

export default Analytics;