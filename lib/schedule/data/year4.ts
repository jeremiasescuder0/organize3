import type { RawCommission } from "../types";

export const year4Commissions: RawCommission[] = [
  {
    code: "4K1",
    year: 4,
    shift: "Mañana",
    s1: {
      slots: [["08:00","08:45"],["08:45","09:30"],["09:40","10:25"],["10:25","11:10"],["11:20","12:05"],["12:05","12:50"],["13:15","14:00"]],
      grid: [
        ["ADSI","RED","SIM","ADSI","GMP / GIP"],
        ["ADSI","RED","SIM","ADSI","GMP / GIP"],
        ["ADSI","IOP","SIM","ADSI","GMP / GIP"],
        ["IOP","IOP","GREEN","SIM","GREEN"],
        ["IOP","GMP / GIP","GREEN","SIM","GREEN"],
        ["RED","GMP / GIP","GREEN","SIM","GREEN"],
        ["RED","GMP / GIP","","",""],
      ],
    },
    s2: {
      slots: [["08:00","08:45"],["08:45","09:30"],["09:40","10:25"],["10:25","11:10"],["11:20","12:05"],["12:05","12:50"],["13:15","14:00"]],
      grid: [
        ["ADSI","RED","LEG","ADSI","TPA"],
        ["ADSI","RED","LEG","ADSI","TPA"],
        ["ADSI","IOP","LEG","ADSI","TPA"],
        ["IOP","IOP","LEG","ICS","DAO"],
        ["IOP","ICS","TPA","ICS","DAO"],
        ["RED","ICS","TPA","ICS","DAO"],
        ["RED","ICS","TPA","","DAO"],
      ],
    },
  },
  {
    code: "4K2",
    year: 4,
    shift: "Tarde",
    s1: {
      slots: [["12:05","12:50"],["13:15","14:00"],["14:00","14:45"],["14:55","15:40"],["15:40","16:25"],["16:35","17:20"],["17:20","18:05"]],
      grid: [
        ["IOP","SIM","","",""],
        ["IOP","SIM","ADSI","GIP","GIP"],
        ["RED","SIM","ADSI","GIP","GIP"],
        ["RED","RED","ADSI","GIP","GIP"],
        ["ADSI","RED","GMP/GREEN","GMP/GREEN","SIM"],
        ["ADSI","IOP","GMP/GREEN","GMP/GREEN","SIM"],
        ["ADSI","IOP","GMP/GREEN","GMP/GREEN","SIM"],
      ],
    },
    s2: {
      slots: [["12:05","12:50"],["13:15","14:00"],["14:00","14:45"],["14:55","15:40"],["15:40","16:25"],["16:35","17:20"],["17:20","18:05"]],
      grid: [
        ["IOP","ICS","","",""],
        ["IOP","ICS","ADSI","","TPA"],
        ["RED","ICS","ADSI","","TPA"],
        ["RED","RED","ADSI","LEG","TPA"],
        ["ADSI","RED","TPA","LEG","ICS"],
        ["ADSI","IOP","TPA","LEG","ICS"],
        ["ADSI","IOP","TPA","LEG","ICS"],
      ],
    },
  },
  {
    code: "4K3",
    year: 4,
    shift: "Noche",
    s1: {
      slots: [["17:20","18:05"],["18:15","19:00"],["19:00","19:45"],["19:55","20:40"],["20:40","21:25"],["21:35","22:20"],["22:20","23:05"]],
      grid: [
        ["ADSI","","IOP","","RED"],
        ["ADSI","GMP / GIP","IOP","ADSI","RED"],
        ["ADSI","GMP / GIP","RED","ADSI","IOP"],
        ["","GMP / GIP","RED","ADSI","IOP"],
        ["SIM","","GMP / GIP","","SIM"],
        ["SIM","","GMP / GIP","","SIM"],
        ["SIM","","GMP / GIP","","SIM"],
      ],
    },
    s2: {
      slots: [["17:20","18:05"],["18:15","19:00"],["19:00","19:45"],["19:55","20:40"],["20:40","21:25"],["21:35","22:20"],["22:20","23:05"]],
      grid: [
        ["ADSI","DAO","IOP","","RED"],
        ["ADSI","DAO","IOP","ADSI","RED"],
        ["ADSI","DAO","RED","ADSI","IOP"],
        ["LEG","DAO","RED","ADSI","IOP"],
        ["LEG","TPA","ICS","TPA","ICS"],
        ["LEG","TPA","ICS","TPA","ICS"],
        ["LEG","TPA","ICS","TPA","ICS"],
      ],
    },
  },
  {
    code: "4K4",
    year: 4,
    shift: "Noche",
    s1: {
      slots: [["17:20","18:05"],["18:15","19:00"],["19:00","19:45"],["19:55","20:40"],["20:40","21:25"],["21:35","22:20"],["22:20","23:05"]],
      grid: [
        ["RED","","ADSI","","RED"],
        ["RED","","ADSI","RED","ICS"],
        ["IOP","","ADSI","IOP","ICS"],
        ["IOP","","LEG","IOP",""],
        ["ADSI","ICS","LEG","TA","TA"],
        ["ADSI","ICS","LEG","TA","TA"],
        ["ADSI","ICS","LEG","TA","TA"],
      ],
    },
    s2: {
      slots: [["17:20","18:05"],["18:15","19:00"],["19:00","19:45"],["19:55","20:40"],["20:40","21:25"],["21:35","22:20"],["22:20","23:05"]],
      grid: [
        ["RED","","ADSI","RED",""],
        ["RED","GREEN/CMD","ADSI","RED","GREEN/CMD"],
        ["IOP","GREEN/CMD","ADSI","IOP","GREEN/CMD"],
        ["IOP","GREEN/CMD","SIM","IOP","GREEN/CMD"],
        ["ADSI","SIM","SIM","GMP/ Devops/ SDS","GMP/ Devops/ SDS"],
        ["ADSI","SIM","SIM","GMP/ Devops/ SDS","GMP/ Devops/ SDS"],
        ["ADSI","SIM","","GMP/ Devops/ SDS","GMP/ Devops/ SDS"],
      ],
    },
  },
];
