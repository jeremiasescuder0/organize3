import type { RawCommission } from "../types";

export const year5Commissions: RawCommission[] = [
  {
    code: "5K1",
    year: 5,
    shift: "Mañana",
    s1: {
      slots: [["08:00","08:45"],["08:45","09:30"],["09:40","10:25"],["10:25","11:10"],["11:20","12:05"],["12:05","12:50"],["13:15","14:00"]],
      grid: [
        ["SSI","PROY","GG","SG","SSI","SWL"],
        ["SSI","PROY","GG","SG","SSI","SWL"],
        ["SSI","PROY","GG","SG","SSI","SWL"],
        ["GG","PROY","SG","SG","DEC / GEE",""],
        ["GG","","PROY","SG","DEC / GEE",""],
        ["GG","","PROY","SG","DEC / GEE",""],
        ["","","","SG","DEC / GEE",""],
      ],
    },
    s2: {
      slots: [["08:00","08:45"],["08:45","09:30"],["09:40","10:25"],["10:25","11:10"],["11:20","12:05"],["12:05","12:50"],["13:15","14:00"]],
      grid: [
        ["IAR","PROY","HB","CD","CD"],
        ["IAR","PROY","HB","CD","CD"],
        ["IAR","PROY","HB","CD","CD"],
        ["HB","PROY","IAR","CON / CDEV","CON / CDEV"],
        ["HB","PROY","IAR","CON / CDEV","CON / CDEV"],
        ["HB","PROY","IAR","CON / CDEV","CON / CDEV"],
        ["","","","",""],
      ],
    },
  },
  {
    code: "5K2",
    year: 5,
    shift: "Tarde",
    s1: {
      slots: [["12:05","12:50"],["13:15","14:00"],["14:00","14:45"],["14:55","15:40"],["15:40","16:25"],["16:35","17:20"],["17:20","18:05"]],
      grid: [
        ["SSI","","","SG",""],
        ["SSI","PROY","GG","SG","SSI"],
        ["SSI","PROY","GG","SG","SSI"],
        ["SG","PROY","GG","SG","SSI"],
        ["SG","PROY","CDEV / GEE","GG","CDEV / GEE"],
        ["SG","PROY","CDEV / GEE","GG","CDEV / GEE"],
        ["SG","PROY","CDEV / GEE","GG","CDEV / GEE"],
      ],
    },
    s2: {
      slots: [["12:05","12:50"],["13:15","14:00"],["14:00","14:45"],["14:55","15:40"],["15:40","16:25"],["16:35","17:20"],["17:20","18:05"]],
      grid: [
        ["","","","",""],
        ["CD","PROY","DEC / CON","IAR","DEC / CON"],
        ["CD","PROY","DEC / CON","IAR","DEC / CON"],
        ["CD","PROY","DEC / CON","IAR","DEC / CON"],
        ["IAR","PROY","CD","HB","HB"],
        ["IAR","PROY","CD","HB","HB"],
        ["IAR","PROY","CD","HB","HB"],
      ],
    },
  },
  {
    code: "5K3",
    year: 5,
    shift: "Noche",
    s1: {
      slots: [["18:15","19:00"],["19:00","19:45"],["19:55","20:40"],["20:40","21:25"],["21:35","22:20"],["22:20","23:05"]],
      grid: [
        ["GG","PROY","SSI","GG","SSI"],
        ["GG","PROY","SSI","GG","SSI"],
        ["GG","PROY","SSI","GG","SSI"],
        ["GEE","PROY","IAR","IAR","GEE"],
        ["GEE","PROY","IAR","IAR","GEE"],
        ["GEE","PROY","IAR","IAR","GEE"],
      ],
    },
    s2: {
      slots: [["18:15","19:00"],["19:00","19:45"],["19:55","20:40"],["20:40","21:25"],["21:35","22:20"],["22:20","23:05"]],
      grid: [
        ["TSO","PROY","CD","DTB / TSO","ET"],
        ["TSO","PROY","CD","DTB / TSO","ET"],
        ["TSO","PROY","CD","DTB / TSO","ET"],
        ["ET / DTB","PROY","IAR","IAR","CD"],
        ["ET / DTB","PROY","IAR","IAR","CD"],
        ["ET / DTB","PROY","IAR","IAR","CD"],
      ],
    },
  },
  {
    code: "5K4",
    year: 5,
    shift: "Noche",
    s1: {
      slots: [["17:20","18:05"],["18:15","19:00"],["19:00","19:45"],["19:55","20:40"],["20:40","21:25"],["21:35","22:20"],["22:20","23:05"]],
      grid: [
        ["GG","","","GG",""],
        ["GG","PROY","CD","GG","CD"],
        ["GG","PROY","CD","GG","CD"],
        ["SG","PROY","CD","SG","CD"],
        ["SG","PROY","ET","SG","ET"],
        ["SG","PROY","ET","SG","ET"],
        ["SG","PROY","ET","SG","ET"],
      ],
    },
    s2: {
      slots: [["17:20","18:05"],["18:15","19:00"],["19:00","19:45"],["19:55","20:40"],["20:40","21:25"],["21:35","22:20"],["22:20","23:05"]],
      grid: [
        ["","","SSI","CDEV / IAW",""],
        ["CDEV / IAW","PROY","SSI","CDEV / IAW","SSI"],
        ["CDEV / IAW","PROY","SSI","CDEV / IAW","SSI"],
        ["CDEV / IAW","PROY","SG","SG","SSI"],
        ["CON","PROY","SG","SG","CON"],
        ["CON","PROY","SG","SG","CON"],
        ["CON","PROY","SG","SG","CON"],
      ],
    },
  },
];
