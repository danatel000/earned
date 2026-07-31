import {normalizeFrame} from "../forgeAscii.js";

const frame=rows=>normalizeFrame(rows,32);

export const SQUAT_FRAMES=[
  frame([
    "            O", "<<BAR.TOP>>", "<<BAR.MID>>", "<<BAR.BOT>>",
    "           /|\\", "          / | \\", "            |", "           / \\",
    "          /   \\", "         _|   |_", "        TOP / BRACE", "",
  ]),
  frame([
    "", "           O", "<<BAR.TOP>>", "<<BAR.MID>>", "<<BAR.BOT>>",
    "          /|\\", "         / | \\", "          / \\", "       __/   \\__",
    "        DESCEND", "", "",
  ]),
  frame([
    "", "", "<<BAR.TOP>>", "<<BAR.MID>>", "<<BAR.BOT>>",
    "         \\ O /", "          \\|/", "       ___/ \\___", "      |         |",
    "        DEPTH", "", "",
  ]),
  frame([
    "", "           O", "<<BAR.TOP>>", "<<BAR.MID>>", "<<BAR.BOT>>",
    "          /|\\", "       __/ | \\__", "         /   \\", "        /     \\",
    "         DRIVE", "", "",
  ]),
  frame([
    "            O", "<<BAR.TOP>>", "<<BAR.MID>>", "<<BAR.BOT>>",
    "           /|\\", "            |", "           / \\", "          /   \\",
    "         LOCKOUT", "", "", "",
  ]),
];
