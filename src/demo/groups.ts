import type { PublicGroup } from "../services/publicGroups";
export const demoGroups: PublicGroup[] = [
  {
    id: 100,
    name: "Dein Platz im großen Ganzen.",
    children: [110, 120, 130],
    canSignUp: false,
    information: {
      note: "Eine unvergessliche Show entsteht durch Menschen wie dich. Entdecke die Bereiche von Weihnachten neu erleben und finde das Team, in dem du deine Begeisterung teilen kannst.",
    },
  },
  {
    id: 110,
    name: "Auf der Bühne",
    children: [111, 112],
    canSignUp: false,
    information: {
      note: "Gemeinsam bringen wir Weihnachten zum Leuchten. Mit deiner Stimme, deiner Bewegung und deiner Begeisterung.",
    },
  },
  {
    id: 120,
    name: "Hinter den Kulissen",
    children: [121, 122],
    canSignUp: false,
    information: {
      note: "Hier wird aus einer Idee ein Erlebnis. Für alle, die gerne anpacken und die kleinen Details lieben.",
    },
  },
  {
    id: 130,
    name: "Rund um die Show",
    children: [131],
    canSignUp: false,
    information: {
      note: "Ein herzliches Willkommen macht den Unterschied. Schaffe mit uns einen Ort, an dem sich Menschen wohlfühlen.",
    },
  },
  {
    id: 111,
    name: "Mega-Chor",
    children: [],
    canSignUp: true,
    information: {
      note: "Viele Stimmen. Ein gemeinsamer Moment. Sing mit uns und werde Teil eines besonderen Klangerlebnisses.",
      meetingTime: "Gemeinsame Proben nach Absprache",
    },
  },
  {
    id: 112,
    name: "Tanz & Bewegung",
    children: [],
    canSignUp: false,
    information: {
      note: "Geschichten erzählen, ohne ein Wort zu sagen. Gemeinsam gestalten wir die großen Momente auf der Bühne.",
    },
  },
  {
    id: 121,
    name: "Bühnenbau",
    children: [],
    canSignUp: true,
    information: {
      note: "Du arbeitest gerne mit den Händen? Hilf uns, die Welt unserer Weihnachtsgeschichte entstehen zu lassen.",
    },
  },
  {
    id: 122,
    name: "Kostüm & Maske",
    children: [],
    canSignUp: true,
    information: {
      note: "Mit Liebe zum Detail geben wir jeder Rolle ihr Gesicht.",
    },
  },
  {
    id: 131,
    name: "Willkommensteam",
    children: [],
    canSignUp: true,
    information: {
      note: "Das erste Lächeln des Abends kommt von dir. Gemeinsam heißen wir unsere Gäste willkommen.",
    },
  },
];
