import {normalizeFrame} from "../forgeAscii.js";

const frame=rows=>normalizeFrame(rows,32);

export const DEADLIFT_FRAMES=[
  frame([
    "            O", "           /|\\", "          / | \\", "         _/   \\_",
    "        /       \\", "       SET / WEDGE", "<<BAR.TOP>>", "<<BAR.MID>>",
    "<<BAR.BOT>>", "", "", "",
  ]),
  frame([
    "           O", "          /|\\", "         / | \\", "        /  |  \\",
    "       /  / \\  \\", "       BREAK FLOOR", "<<BAR.TOP>>", "<<BAR.MID>>",
    "<<BAR.BOT>>", "", "", "",
  ]),
  frame([
    "          O", "         /|\\", "        / | \\", "          |",
    "         / \\", "       PASS KNEES", "<<BAR.TOP>>", "<<BAR.MID>>",
    "<<BAR.BOT>>", "", "", "",
  ]),
  frame([
    "          O", "         /|\\", "          |", "          |",
    "         / \\", "        LOCKOUT", "<<BAR.TOP>>", "<<BAR.MID>>",
    "<<BAR.BOT>>", "", "", "",
  ]),
  frame([
    "           O", "          /|\\", "         / | \\", "        /  |  \\",
    "       /  / \\  \\", "        CONTROL", "<<BAR.TOP>>", "<<BAR.MID>>",
    "<<BAR.BOT>>", "", "", "",
  ]),
];
