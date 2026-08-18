import { addDays, format, getDay, startOfMonth } from "date-fns";
import type { CountryCode, Locale } from "@/lib/types";
import { normalizeLocale } from "@/i18n";

export type Holiday = { date: string; name: string; kind: "public" | "observance" };
type HolidayName = Record<Locale, string>;

function dateKey(date: Date) { return format(date, "yyyy-MM-dd"); }
function makeDate(year: number, month: number, day: number) { return new Date(year, month - 1, day, 12, 0, 0); }
function nthWeekday(year: number, month: number, weekday: number, nth: number) { const first=startOfMonth(makeDate(year,month,1)); const offset=(weekday-getDay(first)+7)%7; return addDays(first,offset+(nth-1)*7); }
function lastWeekday(year:number,month:number,weekday:number){const firstNextMonth=makeDate(year,month+1,1);const last=addDays(firstNextMonth,-1);const offset=(getDay(last)-weekday+7)%7;return addDays(last,-offset)}
function easterSunday(year:number){const a=year%19;const b=Math.floor(year/100);const c=year%100;const d=Math.floor(b/4);const e=b%4;const f=Math.floor((b+8)/25);const g=Math.floor((b-f+1)/3);const h=(19*a+b-d-g+15)%30;const i=Math.floor(c/4);const k=c%4;const l=(32+2*e+2*i-h-k)%7;const m=Math.floor((a+11*h+22*l)/451);const month=Math.floor((h+l-7*m+114)/31);const day=((h+l-7*m+114)%31)+1;return makeDate(year,month,day)}

const names = {
  newYear: { fr:"Jour de l’An", en:"New Year's Day", es:"Año Nuevo", pt:"Ano Novo", de:"Neujahr", it:"Capodanno", ar:"رأس السنة" },
  christmas: { fr:"Noël", en:"Christmas Day", es:"Navidad", pt:"Natal", de:"Weihnachten", it:"Natale", ar:"عيد الميلاد" },
  goodFriday: { fr:"Vendredi saint", en:"Good Friday", es:"Viernes Santo", pt:"Sexta-feira Santa", de:"Karfreitag", it:"Venerdì Santo", ar:"الجمعة العظيمة" },
  canadaDay: { fr:"Fête du Canada", en:"Canada Day", es:"Día de Canadá", pt:"Dia do Canadá", de:"Kanada-Tag", it:"Giorno del Canada", ar:"يوم كندا" },
  labourDay: { fr:"Fête du Travail", en:"Labour Day", es:"Día del Trabajo", pt:"Dia do Trabalho", de:"Tag der Arbeit", it:"Festa del Lavoro", ar:"عيد العمال" },
  thanksgiving: { fr:"Action de grâce", en:"Thanksgiving", es:"Acción de Gracias", pt:"Ação de Graças", de:"Erntedankfest", it:"Giorno del Ringraziamento", ar:"عيد الشكر" },
  boxingDay: { fr:"Lendemain de Noël", en:"Boxing Day", es:"Día de San Esteban", pt:"Boxing Day", de:"Zweiter Weihnachtstag", it:"Santo Stefano", ar:"اليوم التالي لعيد الميلاد" },
  quebecDay: { fr:"Fête nationale du Québec", en:"Québec National Holiday", es:"Fiesta nacional de Quebec", pt:"Feriado nacional do Quebec", de:"Nationalfeiertag von Québec", it:"Festa nazionale del Québec", ar:"العيد الوطني لكيبك" },
  familyDay: { fr:"Jour de la famille", en:"Family Day", es:"Día de la Familia", pt:"Dia da Família", de:"Familientag", it:"Giornata della Famiglia", ar:"يوم الأسرة" },
  mlk: { fr:"Journée Martin Luther King Jr.", en:"Martin Luther King Jr. Day", es:"Día de Martin Luther King Jr.", pt:"Dia de Martin Luther King Jr.", de:"Martin-Luther-King-Tag", it:"Giorno di Martin Luther King Jr.", ar:"يوم مارتن لوثر كينغ الابن" },
  presidents: { fr:"Journée des présidents", en:"Presidents' Day", es:"Día de los Presidentes", pt:"Dia dos Presidentes", de:"Präsidententag", it:"Giorno dei Presidenti", ar:"يوم الرؤساء" },
  memorial: { fr:"Memorial Day", en:"Memorial Day", es:"Día de los Caídos", pt:"Memorial Day", de:"Memorial Day", it:"Memorial Day", ar:"يوم الذكرى" },
  independence: { fr:"Fête de l’Indépendance", en:"Independence Day", es:"Día de la Independencia", pt:"Dia da Independência", de:"Unabhängigkeitstag", it:"Giorno dell’Indipendenza", ar:"عيد الاستقلال" },
  easterMonday: { fr:"Lundi de Pâques", en:"Easter Monday", es:"Lunes de Pascua", pt:"Segunda-feira de Páscoa", de:"Ostermontag", it:"Lunedì dell’Angelo", ar:"اثنين الفصح" },
  victory: { fr:"Victoire de 1945", en:"Victory in Europe Day", es:"Día de la Victoria de 1945", pt:"Dia da Vitória de 1945", de:"Tag des Sieges 1945", it:"Giorno della Vittoria 1945", ar:"يوم النصر 1945" },
  ascension: { fr:"Ascension", en:"Ascension Day", es:"Ascensión", pt:"Ascensão", de:"Christi Himmelfahrt", it:"Ascensione", ar:"عيد الصعود" },
  bastille: { fr:"Fête nationale", en:"Bastille Day", es:"Fiesta nacional francesa", pt:"Festa Nacional Francesa", de:"Französischer Nationalfeiertag", it:"Festa nazionale francese", ar:"العيد الوطني الفرنسي" },
  assumption: { fr:"Assomption", en:"Assumption Day", es:"Asunción", pt:"Assunção", de:"Mariä Himmelfahrt", it:"Assunzione", ar:"عيد انتقال العذراء" },
  allSaints: { fr:"Toussaint", en:"All Saints' Day", es:"Todos los Santos", pt:"Dia de Todos os Santos", de:"Allerheiligen", it:"Ognissanti", ar:"عيد جميع القديسين" },
  armistice: { fr:"Armistice", en:"Armistice Day", es:"Día del Armisticio", pt:"Dia do Armistício", de:"Waffenstillstandstag", it:"Giorno dell’Armistizio", ar:"يوم الهدنة" },
  youth: { fr:"Fête de la Jeunesse", en:"Youth Day", es:"Día de la Juventud", pt:"Dia da Juventude", de:"Tag der Jugend", it:"Giornata della Gioventù", ar:"عيد الشباب" },
  national: { fr:"Fête nationale", en:"National Day", es:"Fiesta nacional", pt:"Dia Nacional", de:"Nationalfeiertag", it:"Festa nazionale", ar:"العيد الوطني" },
} satisfies Record<string, HolidayName>;

function localized(name: HolidayName, locale: string) { return name[normalizeLocale(locale)]; }
export function getHolidays(year:number,country:CountryCode,region:string,locale:string):Holiday[]{const holidays:Holiday[]=[];const push=(date:Date,name:HolidayName,kind:Holiday["kind"]="public")=>holidays.push({date:dateKey(date),name:localized(name,locale),kind});push(makeDate(year,1,1),names.newYear);push(makeDate(year,12,25),names.christmas);if(country==="CA"){push(addDays(easterSunday(year),-2),names.goodFriday);push(makeDate(year,7,1),names.canadaDay);push(nthWeekday(year,9,1,1),names.labourDay);push(nthWeekday(year,10,1,2),names.thanksgiving);push(makeDate(year,12,26),names.boxingDay,"observance");if(region==="QC")push(makeDate(year,6,24),names.quebecDay);if(["ON","BC","AB"].includes(region))push(nthWeekday(year,2,1,3),names.familyDay)}if(country==="US"){push(nthWeekday(year,1,1,3),names.mlk);push(nthWeekday(year,2,1,3),names.presidents);push(lastWeekday(year,5,1),names.memorial);push(makeDate(year,7,4),names.independence);push(nthWeekday(year,9,1,1),names.labourDay);push(nthWeekday(year,11,4,4),names.thanksgiving)}if(country==="FR"){push(addDays(easterSunday(year),1),names.easterMonday);push(makeDate(year,5,1),names.labourDay);push(makeDate(year,5,8),names.victory);push(addDays(easterSunday(year),39),names.ascension);push(makeDate(year,7,14),names.bastille);push(makeDate(year,8,15),names.assumption);push(makeDate(year,11,1),names.allSaints);push(makeDate(year,11,11),names.armistice)}if(country==="CM"){push(makeDate(year,2,11),names.youth);push(makeDate(year,5,1),names.labourDay);push(makeDate(year,5,20),names.national);push(makeDate(year,8,15),names.assumption)}return holidays.sort((a,b)=>a.date.localeCompare(b.date))}
export function holidayForDate(date:Date,country:CountryCode,region:string,locale:string){return getHolidays(date.getFullYear(),country,region,locale).find((holiday)=>holiday.date===dateKey(date))}
