import type { RawCommission } from "../types"

// Standard slot definitions
const M8: [string, string][] = [
  ["08:00", "08:45"],
  ["08:45", "09:30"],
  ["09:40", "10:25"],
  ["10:25", "11:10"],
  ["11:20", "12:05"],
  ["12:05", "12:50"],
  ["13:15", "14:00"],
]

const T: [string, string][] = [
  ["12:05", "12:50"],
  ["13:15", "14:00"],
  ["14:00", "14:45"],
  ["14:55", "15:40"],
  ["15:40", "16:25"],
  ["16:35", "17:20"],
  ["17:20", "18:05"],
]

const N: [string, string][] = [
  ["17:20", "18:05"],
  ["18:15", "19:00"],
  ["19:00", "19:45"],
  ["19:55", "20:40"],
  ["20:40", "21:25"],
  ["21:35", "22:20"],
  ["22:20", "23:05"],
]

// Note: Sub-variant commissions 2K1B, 2K3A, and 2K11B are omitted as they
// contain only 1 subject each and would clutter the data without adding value.

export const year2Commissions: RawCommission[] = [
  {
    code: "2K1",
    year: 2,
    shift: "Mañana",
    s1: {
      slots: M8,
      grid: [
        ["SOP", "AM2", "FISII", "SSL", "ASI"],
        ["SOP", "AM2", "FISII", "SSL", "ASI"],
        ["AM2", "AM2", "FISII", "SSL", "ASI"],
        ["AM2", "SSL", "ASI", "SSL", "FISII"],
        ["EST", "SSL", "ASI", "EST", "FISII"],
        ["EST", "SSL", "ASI", "EST", "SOP"],
        ["EST", "SSL", "", "EST", "SOP"],
      ],
    },
    s2: {
      slots: M8,
      grid: [
        ["SOP", "AM2", "FISII", "PPR", "ASI"],
        ["SOP", "AM2", "FISII", "PPR", "ASI"],
        ["AM2", "AM2", "FISII", "PPR", "ASI"],
        ["AM2", "PPR", "ASI", "PPR", "FISII"],
        ["", "PPR", "ASI", "", "FISII"],
        ["", "PPR", "ASI", "", "SOP"],
        ["", "PPR", "", "", "SOP"],
      ],
    },
  },
  {
    code: "2K2",
    year: 2,
    shift: "Mañana",
    s1: {
      slots: M8,
      grid: [
        ["FISII", "AM2", "SSL", "EST", "SSL"],
        ["FISII", "AM2", "SSL", "EST", "SSL"],
        ["FISII", "SOP", "SSL", "EST", "SSL"],
        ["EST", "SOP", "SSL", "SOP", "SSL"],
        ["EST", "ASI", "AM2", "SOP", "ASI"],
        ["EST", "ASI", "AM2", "FISII", "ASI"],
        ["", "ASI", "AM2", "FISII", "ASI"],
      ],
    },
    s2: {
      slots: M8,
      grid: [
        ["FISII", "AM2", "PPR", "PPR", "PPR"],
        ["FISII", "AM2", "PPR", "PPR", ""],
        ["FISII", "SOP", "PPR", "PPR", ""],
        ["", "SOP", "", "SOP", ""],
        ["", "ASI", "AM2", "SOP", "ASI"],
        ["", "ASI", "AM2", "FISII", "ASI"],
        ["", "ASI", "AM2", "FISII", "ASI"],
      ],
    },
  },
  {
    code: "2K3",
    year: 2,
    shift: "Mañana",
    s1: {
      slots: M8,
      grid: [
        ["SSL", "EST", "ASI", "FISII", "FISII"],
        ["SSL", "EST", "ASI", "FISII", "FISII"],
        ["SSL", "EST", "ASI", "SOP", "FISII"],
        ["SSL", "AM2", "SSL", "SOP", "EST"],
        ["AM2", "AM2", "SSL", "ASI", "EST"],
        ["AM2", "SOP", "SSL", "ASI", "EST"],
        ["AM2", "SOP", "SSL", "ASI", ""],
      ],
    },
    s2: {
      slots: M8,
      grid: [
        ["PPR", "", "ASI", "FISII", "FISII"],
        ["PPR", "", "ASI", "FISII", "FISII"],
        ["PPR", "", "ASI", "SOP", "FISII"],
        ["PPR", "AM2", "PPR", "SOP", ""],
        ["AM2", "AM2", "PPR", "ASI", ""],
        ["AM2", "SOP", "PPR", "ASI", ""],
        ["AM2", "SOP", "PPR", "ASI", ""],
      ],
    },
  },
  {
    code: "2K4",
    year: 2,
    shift: "Mañana",
    s1: {
      slots: M8,
      grid: [
        ["AM2", "SOP", "", "PPR", ""],
        ["AM2", "SOP", "", "PPR", ""],
        ["SOP", "FISII", "", "PPR", ""],
        ["SOP", "FISII", "PPR", "PPR", "ASI"],
        ["FISII", "AM2", "ASI", "PPR", "ASI"],
        ["FISII", "AM2", "ASI", "PPR", "ASI"],
        ["FISII", "AM2", "ASI", "PPR", ""],
      ],
    },
    s2: {
      slots: M8,
      grid: [
        ["AM2", "SOP", "SSL", "EST", "EST"],
        ["AM2", "SOP", "SSL", "EST", "EST"],
        ["SOP", "FISII", "SSL", "EST", "EST"],
        ["SOP", "FISII", "SSL", "SSL", "ASI"],
        ["FISII", "AM2", "ASI", "SSL", "ASI"],
        ["FISII", "AM2", "ASI", "SSL", "ASI"],
        ["FISII", "AM2", "ASI", "SSL", ""],
      ],
    },
  },
  {
    code: "2K5",
    year: 2,
    shift: "Tarde",
    s1: {
      slots: T,
      grid: [
        ["SSL", "FISII", "SOP", "FISII", ""],
        ["SSL", "FISII", "SOP", "FISII", "SSL"],
        ["SSL", "FISII", "AM2", "AM2", "SSL"],
        ["SSL", "ASI", "AM2", "AM2", "SSL"],
        ["EST", "ASI", "AM2", "EST", "SSL"],
        ["EST", "ASI", "ASI", "EST", "SOP"],
        ["EST", "ASI", "ASI", "EST", "SOP"],
      ],
    },
    s2: {
      slots: T,
      grid: [
        ["", "FISII", "SOP", "FISII", ""],
        ["", "FISII", "SOP", "FISII", "PPR"],
        ["", "FISII", "AM2", "AM2", "PPR"],
        ["PPR", "ASI", "AM2", "AM2", "PPR"],
        ["PPR", "ASI", "AM2", "", "PPR"],
        ["PPR", "ASI", "ASI", "", "SOP"],
        ["PPR", "ASI", "ASI", "", "SOP"],
      ],
    },
  },
  {
    code: "2K6",
    year: 2,
    shift: "Tarde",
    s1: {
      slots: T,
      grid: [
        ["FISII", "SSL", "EST", "", "SOP"],
        ["FISII", "SSL", "EST", "ASI", "SOP"],
        ["FISII", "SSL", "EST", "ASI", "EST"],
        ["AM2", "SSL", "SSL", "ASI", "EST"],
        ["AM2", "ASI", "SSL", "AM2", "EST"],
        ["SOP", "ASI", "SSL", "AM2", "FISII"],
        ["SOP", "ASI", "SSL", "AM2", "FISII"],
      ],
    },
    s2: {
      slots: T,
      grid: [
        ["FISII", "PPR", "", "", "SOP"],
        ["FISII", "PPR", "", "ASI", "SOP"],
        ["FISII", "PPR", "", "ASI", ""],
        ["AM2", "PPR", "PPR", "ASI", ""],
        ["AM2", "ASI", "PPR", "AM2", ""],
        ["SOP", "ASI", "PPR", "AM2", "FISII"],
        ["SOP", "ASI", "PPR", "AM2", "FISII"],
      ],
    },
  },
  {
    code: "2K7",
    year: 2,
    shift: "Tarde",
    s1: {
      slots: T,
      grid: [
        ["AM2", "FISII", "PPR", "", "AM2"],
        ["AM2", "FISII", "PPR", "", "AM2"],
        ["SOP", "FISII", "PPR", "", "AM2"],
        ["SOP", "FISII", "PPR", "PPR", ""],
        ["", "FISII", "ASI", "PPR", "ASI"],
        ["", "SOP", "ASI", "PPR", "ASI"],
        ["", "SOP", "ASI", "PPR", "ASI"],
      ],
    },
    s2: {
      slots: T,
      grid: [
        ["AM2", "FISII", "SSL", "", "AM2"],
        ["AM2", "FISII", "SSL", "", "AM2"],
        ["SOP", "FISII", "SSL", "", "AM2"],
        ["SOP", "FISII", "SSL", "SSL", ""],
        ["EST", "FISII", "ASI", "SSL", "ASI"],
        ["EST", "SOP", "ASI", "SSL", "ASI"],
        ["EST", "SOP", "ASI", "SSL", "ASI"],
      ],
    },
  },
  {
    code: "2K8",
    year: 2,
    shift: "Noche",
    s1: {
      slots: N,
      grid: [
        ["", "SSL", "FISII", "EST", "EST"],
        ["AM2", "SSL", "FISII", "EST", "EST"],
        ["AM2", "SSL", "SOP", "EST", "EST"],
        ["AM2", "SSL", "SOP", "SOP", "SSL"],
        ["ASI", "FISII", "ASI", "SOP", "SSL"],
        ["ASI", "FISII", "ASI", "AM2", "SSL"],
        ["ASI", "FISII", "ASI", "AM2", "SSL"],
      ],
    },
    s2: {
      slots: N,
      grid: [
        ["", "PPR", "FISII", "", ""],
        ["AM2", "PPR", "FISII", "", ""],
        ["AM2", "PPR", "SOP", "", ""],
        ["AM2", "PPR", "SOP", "SOP", "PPR"],
        ["ASI", "FISII", "ASI", "SOP", "PPR"],
        ["ASI", "FISII", "ASI", "AM2", "PPR"],
        ["ASI", "FISII", "ASI", "AM2", "PPR"],
      ],
    },
  },
  {
    code: "2K9",
    year: 2,
    shift: "Noche",
    s1: {
      slots: N,
      grid: [
        ["ASI", "FISII", "SOP", "SSL", "AM2"],
        ["ASI", "FISII", "SOP", "SSL", "AM2"],
        ["ASI", "FISII", "FISII", "SSL", "SOP"],
        ["SSL", "AM2", "FISII", "SSL", "SOP"],
        ["SSL", "AM2", "EST", "ASI", "EST"],
        ["SSL", "AM2", "EST", "ASI", "EST"],
        ["SSL", "", "EST", "ASI", "EST"],
      ],
    },
    s2: {
      slots: N,
      grid: [
        ["ASI", "FISII", "SOP", "PPR", "AM2"],
        ["ASI", "FISII", "SOP", "PPR", "AM2"],
        ["ASI", "FISII", "FISII", "PPR", "SOP"],
        ["PPR", "AM2", "FISII", "PPR", "SOP"],
        ["PPR", "AM2", "", "ASI", ""],
        ["PPR", "AM2", "", "ASI", ""],
        ["PPR", "", "", "ASI", ""],
      ],
    },
  },
  {
    code: "2K10",
    year: 2,
    shift: "Noche",
    s1: {
      slots: N,
      grid: [
        ["SOP", "ASI", "ASI", "", "SOP"],
        ["SOP", "ASI", "ASI", "AM2", "SOP"],
        ["FISII", "ASI", "ASI", "AM2", "AM2"],
        ["FISII", "PPR", "PPR", "AM2", "AM2"],
        ["", "PPR", "PPR", "", "FISII"],
        ["", "PPR", "PPR", "", "FISII"],
        ["", "PPR", "PPR", "", "FISII"],
      ],
    },
    s2: {
      slots: N,
      grid: [
        ["SOP", "ASI", "ASI", "", "SOP"],
        ["SOP", "ASI", "ASI", "AM2", "SOP"],
        ["FISII", "ASI", "ASI", "AM2", "AM2"],
        ["FISII", "SSL", "SSL", "AM2", "AM2"],
        ["EST", "SSL", "SSL", "FISII", "EST"],
        ["EST", "SSL", "SSL", "FISII", "EST"],
        ["EST", "SSL", "SSL", "FISII", "EST"],
      ],
    },
  },
  {
    code: "2K11",
    year: 2,
    shift: "Mañana",
    s1: {
      slots: M8,
      grid: [
        ["SOP", "", "", "SSL", "ASI"],
        ["SOP", "", "", "SSL", "ASI"],
        ["", "", "", "SSL", "ASI"],
        ["", "SSL", "ASI", "SSL", ""],
        ["EST", "SSL", "ASI", "EST", ""],
        ["EST", "SSL", "ASI", "EST", "SOP"],
        ["EST", "SSL", "", "EST", "SOP"],
      ],
    },
    s2: {
      slots: M8,
      grid: [
        ["SOP", "", "", "PPR", "ASI"],
        ["SOP", "", "", "PPR", "ASI"],
        ["", "", "", "PPR", "ASI"],
        ["", "PPR", "ASI", "PPR", ""],
        ["", "PPR", "ASI", "", ""],
        ["", "PPR", "ASI", "", "SOP"],
        ["", "PPR", "", "", "SOP"],
      ],
    },
  },
]
