import {normalizeFrame} from "../forgeAscii.js";

const frame=rows=>normalizeFrame(rows,32);

export const BENCH_FRAMES=[
  frame([
    "<<BAR.TOP>>", "<<BAR.MID>>", "<<BAR.BOT>>", "        |       |",
    "        |  O    |", "        |_/|\\__|", "     ___/  |   \\___", "    |______________|",
    "       START / STACK", "", "", "",
  ]),
  frame([
    "", "<<BAR.TOP>>", "<<BAR.MID>>", "<<BAR.BOT>>",
    "          \\ O /", "       _____|_____", "     _/      |    \\_", "    |______________|",
    "          LOWER", "", "", "",
  ]),
  frame([
    "", "", "<<BAR.TOP>>", "<<BAR.MID>>", "<<BAR.BOT>>",
    "          _O_", "     ____/  |  \\____", "    |______________|",
    "       CHEST / PAUSE", "", "", "",
  ]),
  frame([
    "", "<<BAR.TOP>>", "<<BAR.MID>>", "<<BAR.BOT>>",
    "          /O\\", "       ___/ | \\___", "     _/     |     \\_", "    |______________|",
    "          PRESS", "", "", "",
  ]),
  frame([
    "<<BAR.TOP>>", "<<BAR.MID>>", "<<BAR.BOT>>", "        |       |",
    "        |  O    |", "        |_/|\\__|", "     ___/  |   \\___", "    |______________|",
    "          LOCKOUT", "", "", "",
  ]),
];
