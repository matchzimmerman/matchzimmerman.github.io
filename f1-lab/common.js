window.RACE = {
  title: "Strategy Lab // Test Session",
  totalLaps: 52,
  drivers: [
    {code:"NOR", gap:0.0, tireAge:17, deg:0.08, undercut:0.20, pace:-0.05, compound:"M"},
    {code:"LEC", gap:2.8, tireAge:19, deg:0.11, undercut:0.74, pace:0.18, compound:"M"},
    {code:"RUS", gap:5.6, tireAge:12, deg:0.06, undercut:0.35, pace:-0.10, compound:"H"},
    {code:"PIA", gap:8.4, tireAge:20, deg:0.13, undercut:0.82, pace:0.24, compound:"M"},
    {code:"VER", gap:11.7, tireAge:10, deg:0.05, undercut:0.28, pace:-0.18, compound:"H"},
    {code:"HAM", gap:15.3, tireAge:22, deg:0.15, undercut:0.91, pace:0.30, compound:"M"},
    {code:"ALO", gap:18.0, tireAge:14, deg:0.08, undercut:0.48, pace:0.02, compound:"H"},
    {code:"SAI", gap:21.8, tireAge:24, deg:0.16, undercut:0.95, pace:0.34, compound:"M"}
  ],
  scenarios: [
    {lap:34,remaining:18,pitLoss:21.8,tireAge:19,rivalGap:3.6,rows:[{lap:31,you:94.21,rival:93.92,gap:4.8},{lap:32,you:94.29,rival:93.90,gap:4.5},{lap:33,you:94.38,rival:93.95,gap:4.1},{lap:34,you:94.51,rival:93.97,gap:3.6}],best:"PIT NOW",expl:"Your average loss is accelerating and the rival is already inside the projected crossover window. The undercut is plausible if the out-lap is clean."},
    {lap:42,remaining:10,pitLoss:20.9,tireAge:9,rivalGap:7.1,rows:[{lap:39,you:92.88,rival:93.02,gap:6.4},{lap:40,you:92.85,rival:93.07,gap:6.6},{lap:41,you:92.83,rival:93.12,gap:6.8},{lap:42,you:92.79,rival:93.10,gap:7.1}],best:"STAY OUT",expl:"The gap is growing in your favor. Giving away a full pit-loss now would throw away track position without a demonstrated pace problem."},
    {lap:47,remaining:5,pitLoss:21.2,tireAge:26,rivalGap:1.9,rows:[{lap:44,you:95.10,rival:94.72,gap:3.2},{lap:45,you:95.24,rival:94.76,gap:2.8},{lap:46,you:95.37,rival:94.82,gap:2.4},{lap:47,you:95.48,rival:94.91,gap:1.9}],best:"DEFEND",expl:"There are too few laps left to recover a normal pit loss. The rational play is to manage deployment and track position unless tire failure risk becomes dominant."}
  ]
};
