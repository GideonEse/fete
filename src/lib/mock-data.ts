export const members = [
  { id: '1', name: 'Eleanor Vance', avatar: 'https://placehold.co/100x100.png' },
  { id: '2', name: 'Marcus Thorne', avatar: 'https://placehold.co/100x100.png' },
  { id: '3', name: 'Seraphina Reed', avatar: 'https://placehold.co/100x100.png' },
  { id: '4', name: 'Julian Croft', avatar: 'https://placehold.co/100x100.png' },
  { id: '5', name: 'Isabelle Luna', avatar: 'https://placehold.co/100x100.png' },
  { id: '6', name: 'Adrian Stone', avatar: 'https://placehold.co/100x100.png' },
  { id: '7', name: 'Clara Belle', avatar: 'https://placehold.co/100x100.png' },
  { id: '8', name: 'Gideon Cross', avatar: 'https://placehold.co/100x100.png' },
];

export const attendanceStats = {
  totalMembers: 152,
  present: 134,
  late: 18,
};

export const chartData = [
  { name: 'Jan', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Feb', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Mar', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Apr', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'May', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Jun', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Jul', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Aug', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Sep', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Oct', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Nov', total: Math.floor(Math.random() * 100) + 50 },
  { name: 'Dec', total: Math.floor(Math.random() * 100) + 50 },
].map(item => ({ ...item, total: (item.total / 200) * 100 }));

export const recentActivity = [
  { id: '1', name: 'Eleanor Vance', time: '9:01 AM', status: 'On-time' },
  { id: '2', name: 'Marcus Thorne', time: '9:03 AM', status: 'On-time' },
  { id: '3', name: 'Julian Croft', time: '9:17 AM', status: 'Late' },
  { id: '4', name: 'Isabelle Luna', time: '9:05 AM', status: 'On-time' },
];

export const attendanceDataString = `
Eleanor Vance, 09:01
Marcus Thorne, 09:03
Seraphina Reed, 09:04
Julian Croft, 09:17
Isabelle Luna, 09:05
Adrian Stone, 09:02
Clara Belle, 09:16
Gideon Cross, 09:00
`;
