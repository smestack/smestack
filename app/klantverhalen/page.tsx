"use client";

import Link from "next/link";
import Image from "next/image";
import { LocaleToggle } from "@/components/LocaleToggle";
import { useLocale, t, type Locale } from "@/lib/i18n";

interface Metric {
  value: string;
  label_nl: string;
  label_en: string;
}

interface Story {
  slug: string;
  name: string;
  role_nl: string;
  role_en: string;
  image: string;
  headline_nl: string;
  headline_en: string;
  pull_quote_nl: string;
  pull_quote_en: string;
  situation_nl: string;
  situation_en: string;
  built_nl: string;
  built_en: string;
  result_nl: string;
  result_en: string;
  metrics: Metric[];
}

// Mock case studies. Names line up with the landing page testimonials so
// readers who clicked through from a quote land in the full story. Numbers
// are illustrative — real customers will replace these.
const stories: Story[] = [
  {
    slug: "mark-loodgieter",
    name: "Mark",
    role_nl: "loodgieter, Utrecht",
    role_en: "plumber, Utrecht",
    image: "/klantverhalen/mark.png",
    headline_nl: "Drie ploegen, één WhatsApp-nummer, geen zaterdag-administratie",
    headline_en: "Three crews, one WhatsApp number, no Saturday paperwork",
    pull_quote_nl:
      "Ik bespaar 3 uur per week op uren bijhouden, en de jongens vinden het zelf ook prettiger. Nooit meer op zaterdag bonnetjes uitzoeken.",
    pull_quote_en:
      "I save 3 hours a week tracking hours, and the guys themselves prefer it. No more sorting receipts on Saturdays.",
    situation_nl:
      "Mark heeft drie ploegen die de hele dag onderweg zijn. Uren werden 's avonds in een schrift bijgehouden, op zaterdag overgetypt in Excel, en op maandag pas gefactureerd. Klanten vroegen telkens 'wanneer komt de factuur?' en Mark wist het zelf niet.",
    situation_en:
      "Mark has three crews on the road all day. Hours were jotted in a notebook in the evening, retyped into Excel on Saturday, and only invoiced on Monday. Customers kept asking 'when does the invoice come?' and Mark himself didn't know.",
    built_nl:
      "Eén WhatsApp-nummer waar elke loodgieter aan het einde van een klus 'Klaar bij Jansen, 2,5u, 1 nieuwe kraan' stuurt. De AI leest het, zet het in een lijst per klant, en stuurt Mark elke vrijdag een overzicht. Geen app om te leren, geen login. Alleen WhatsApp.",
    built_en:
      "One WhatsApp number where each plumber sends 'Done at Jansen, 2.5h, 1 new tap' at the end of a job. The AI reads it, adds it to a list per customer, and sends Mark a Friday summary. No app to learn, no login. Just WhatsApp.",
    result_nl:
      "Drie uur per week terug. De ploeg vergeet minder vaak iets — als je een leeg WhatsApp-veld ziet, weet je dat je nog moet sturen. Facturen gaan nu binnen 48 uur uit in plaats van 5 dagen.",
    result_en:
      "Three hours a week back. The crew forgets less — an empty WhatsApp slot reminds them. Invoices now go out within 48 hours instead of 5 days.",
    metrics: [
      { value: "3u/week", label_nl: "tijd terug", label_en: "time saved" },
      { value: "48u", label_nl: "tot factuur (was 5 dagen)", label_en: "to invoice (was 5 days)" },
      { value: "€0", label_nl: "extra software", label_en: "extra software" },
    ],
  },
  {
    slug: "anouk-interieur",
    name: "Anouk",
    role_nl: "interieurontwerpster, Den Bosch",
    role_en: "interior designer, Den Bosch",
    image: "/klantverhalen/anouk.png",
    headline_nl: "Maandagochtend openen met de juiste vraag, niet het juiste schermpje",
    headline_en: "Opening Monday with the right question, not the right screen",
    pull_quote_nl:
      "Eindelijk weet ik op maandagochtend wie nog moet betalen, zonder dat ik er zelf in moet duiken. Voelt alsof er een collega meedraait.",
    pull_quote_en:
      "I finally know on Monday morning who still needs to pay, without having to dig into it myself. It feels like having an extra colleague.",
    situation_nl:
      "Anouk werkt alleen, met losse onderaannemers per project. Facturen vergaten te betalen was de stille killer: ze had het geld nodig om stoffeerders te betalen, maar de herinneringsmails sturen voelde gênant en kostte een hele middag per maand.",
    situation_en:
      "Anouk works solo, with freelance contractors per project. Forgotten invoices were the silent killer: she needed the cash flow to pay upholsterers, but sending reminder emails felt awkward and took a full afternoon per month.",
    built_nl:
      "Een agent die elke maandagochtend de openstaande facturen langsloopt en concept-mails klaarzet in haar Gmail. Geen automatische verzending — Anouk leest ze, past de toon aan waar nodig, en drukt op verzenden. Drie minuten in plaats van drie uur.",
    built_en:
      "An agent that walks through her open invoices every Monday morning and drafts reminder emails in her Gmail. Nothing auto-sent — Anouk reads them, tweaks the tone if needed, and clicks send. Three minutes instead of three hours.",
    result_nl:
      "Gemiddelde betaaltermijn van 31 naar 18 dagen. Belangrijker: ze begint de week niet meer met administratie-stress maar met klantwerk. De agent draait al 11 weken zonder een verkeerd verstuurde mail.",
    result_en:
      "Average payment term from 31 to 18 days. More importantly: she no longer starts the week with admin stress but with client work. The agent has run for 11 weeks without a wrongly sent email.",
    metrics: [
      { value: "31 → 18", label_nl: "dagen tot betaling", label_en: "days to payment" },
      { value: "3u → 3min", label_nl: "per maand", label_en: "per month" },
      { value: "0", label_nl: "fout verstuurde mails", label_en: "wrongly sent mails" },
    ],
  },
  {
    slug: "rachid-glaszetter",
    name: "Rachid",
    role_nl: "glaszetter, Rotterdam",
    role_en: "glazier, Rotterdam",
    image: "/klantverhalen/rachid.png",
    headline_nl: "Offertes die nooit meer in een mailbox blijven hangen",
    headline_en: "Quotes that never get stuck in an inbox again",
    pull_quote_nl:
      "Ik dacht dat ik 'te klein' was voor AI. Bleek dat juist dít past bij een team van vier — en ik beslis nog steeds zelf wat er live gaat.",
    pull_quote_en:
      "I thought I was 'too small' for AI. Turns out this is exactly the thing that fits a team of four — and I still decide what goes live myself.",
    situation_nl:
      "Rachid stuurt zo'n 30 offertes per maand. De helft kreeg geen reactie — niet omdat de klant niet wilde, maar omdat de mail in een drukke inbox zonk. Handmatig nabellen voelde te pusherig én te tijdrovend.",
    situation_en:
      "Rachid sends about 30 quotes a month. Half got no reply — not because the customer didn't want to, but because the mail sank in a busy inbox. Calling each one back felt too pushy and too time-consuming.",
    built_nl:
      "Een follow-up agent die op dag 4 een korte herinnering klaarzet ('hoi, mocht je nog vragen hebben, ik denk graag mee') en op dag 10 een laatste check. Rachid keurt elke mail goed voordat ze uitgaan. De toon is afgestemd op zijn eigen stijl door 20 oude mails als voorbeeld te gebruiken.",
    built_en:
      "A follow-up agent that drafts a short reminder on day 4 ('hi, if you have any questions, happy to think along') and a final check on day 10. Rachid approves every email before it goes out. The tone matches his own style after training on 20 of his old mails.",
    result_nl:
      "Conversie van offerte naar opdracht steeg van 28% naar 41% in twee maanden. Geen agressieve sales-mails, gewoon de behoefte om gehoord te zijn nakomen. De mail die de meeste opdrachten oplevert? De zin 'geen haast hoor' op dag 4.",
    result_en:
      "Quote-to-job conversion went from 28% to 41% in two months. No aggressive sales emails, just keeping the promise to follow up. The line that wins the most jobs? 'No rush' on day 4.",
    metrics: [
      { value: "28% → 41%", label_nl: "offerte-conversie", label_en: "quote conversion" },
      { value: "+13", label_nl: "opdrachten/maand", label_en: "jobs/month" },
      { value: "20 mails", label_nl: "voor stem-match", label_en: "for voice match" },
    ],
  },
  {
    slug: "ben-installateur",
    name: "Ben",
    role_nl: "elektrotechnisch installateur, Eindhoven",
    role_en: "electrical engineer, Eindhoven",
    image: "/klantverhalen/ben.png",
    headline_nl: "De telefoon die niet meer in de auto rinkelt",
    headline_en: "The phone that no longer rings in the van",
    pull_quote_nl:
      "Het mooiste: ze installeren niets zonder dat ik akkoord geef. Dat was de drempel. Nu draait alles soepel en ben ik terug aan de keukentafel om half zes.",
    pull_quote_en:
      "The best part: they install nothing without my approval. That was the threshold. Now everything runs smoothly and I'm back at the kitchen table by 5:30.",
    situation_nl:
      "Ben en zijn vrouw Anne hadden 1 telefoonnummer voor het bedrijf. Anne nam op tot 17:00. Daarna ging de telefoon door naar Bens auto — gevaarlijk, ongepast tijdens een klus, en thuis aan tafel onhandig. Bellers kregen vaak voicemail en belden niet terug.",
    situation_en:
      "Ben and his wife Anne had one business phone number. Anne answered until 5pm. After that calls went to Ben's van — unsafe, awkward during a job, and inconvenient at the dinner table. Callers often got voicemail and didn't call back.",
    built_nl:
      "Een AI-receptionist die buiten kantooruren opneemt, een paar standaardvragen stelt (wat is er aan de hand, hoe urgent, wat is het adres) en de samenvatting in WhatsApp bij Ben krijgt. Echt urgent? Belt direct door. Anders: rustig morgenochtend van Anne terugbellen.",
    built_en:
      "An AI receptionist that picks up after hours, asks a few standard questions (what's going on, how urgent, what's the address) and sends Ben a WhatsApp summary. Truly urgent? Patches through immediately. Otherwise: Anne calls back the next morning calmly.",
    result_nl:
      "Anne werkt nu vier dagen per week in plaats van vijf — de twee uren tussen 17 en 19 die zij anders aan inkomende telefoon kwijt was, zijn weg. Geen gemiste klant in 9 weken. Drie keer doorgeschakeld voor echte spoed (lekkage, zekeringkast in brand, geen licht in een ouderenwoning).",
    result_en:
      "Anne now works four days a week instead of five — the two hours between 5 and 7pm she used to spend on incoming calls are gone. No missed customer in 9 weeks. Three times patched through for actual emergencies (leak, fuse box on fire, no light in an elderly home).",
    metrics: [
      { value: "5 → 4", label_nl: "werkdagen Anne", label_en: "Anne's workdays" },
      { value: "9 weken", label_nl: "geen gemiste klant", label_en: "no missed customer" },
      { value: "3", label_nl: "echte spoed-doorschakelingen", label_en: "true emergencies patched" },
    ],
  },
];

export default function KlantverhalenPage() {
  const [locale] = useLocale();
  return (
    <main className="min-h-screen">
      <header className="border-b border-cream-200 px-6 py-4 flex items-center justify-between gap-3">
        <Link href="/" className="mono text-sm uppercase tracking-wider">
          {t(locale, "brand.name")}
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/intake"
            className="mono text-xs uppercase tracking-wider text-zinc-600 hover:text-amber-700"
          >
            {t(locale, "nav.start")}
          </Link>
          <Link
            href="/voorstellen"
            className="mono text-xs uppercase tracking-wider text-zinc-600 hover:text-amber-700"
          >
            {t(locale, "nav.proposals")}
          </Link>
          <LocaleToggle />
        </div>
      </header>

      <section className="px-6 py-16">
        <div className="max-w-prose mx-auto">
          <div className="mono text-xs uppercase tracking-wider text-zinc-600 mb-3">
            {t(locale, "stories.eyebrow")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold leading-tight mb-6">
            {t(locale, "stories.title")}
          </h1>
          <p className="text-lg text-zinc-700 leading-relaxed mb-3">
            {t(locale, "stories.intro")}
          </p>
          <p className="text-xs text-zinc-500 italic">
            {t(locale, "stories.disclaimer")}
          </p>
        </div>
      </section>

      <div className="max-w-prose mx-auto px-6 pb-16 space-y-20">
        {stories.map((s) => (
          <StoryArticle key={s.slug} story={s} locale={locale} />
        ))}
      </div>

      <section className="px-6 py-20 border-t border-cream-200 bg-cream-50">
        <div className="max-w-prose mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-3">
            {t(locale, "stories.cta.headline")}
          </h2>
          <p className="text-zinc-700 mb-8 leading-relaxed">
            {t(locale, "stories.cta.body")}
          </p>
          <Link
            href="/intake"
            className="inline-block min-h-[44px] px-8 py-3 rounded-md font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
          >
            {t(locale, "common.start_intake")}
          </Link>
        </div>
      </section>
    </main>
  );
}

function StoryArticle({ story, locale }: { story: Story; locale: Locale }) {
  const role = locale === "nl" ? story.role_nl : story.role_en;
  const headline = locale === "nl" ? story.headline_nl : story.headline_en;
  const quote = locale === "nl" ? story.pull_quote_nl : story.pull_quote_en;
  const situation = locale === "nl" ? story.situation_nl : story.situation_en;
  const built = locale === "nl" ? story.built_nl : story.built_en;
  const result = locale === "nl" ? story.result_nl : story.result_en;

  return (
    <article id={story.slug} className="scroll-mt-24">
      <div className="mb-8 -mx-6 sm:mx-0 overflow-hidden sm:rounded-lg border-y sm:border border-cream-200 bg-cream-50">
        <Image
          src={story.image}
          alt={
            locale === "nl"
              ? `Portret van ${story.name}, ${story.role_nl}`
              : `Portrait of ${story.name}, ${story.role_en}`
          }
          width={1024}
          height={1024}
          className="w-full h-auto aspect-[4/3] object-cover"
          priority={story.slug === "mark-loodgieter"}
        />
      </div>

      <header className="mb-6">
        <div className="mono text-xs uppercase tracking-wider text-amber-700 mb-3">
          {story.name} · {role}
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold leading-tight">
          {headline}
        </h2>
      </header>

      <blockquote className="border-l-2 border-amber-600 pl-6 mb-8">
        <p className="text-lg text-zinc-800 leading-relaxed italic">
          &ldquo;{quote}&rdquo;
        </p>
      </blockquote>

      <h3 className="mono text-xs uppercase tracking-wider text-zinc-600 mb-2">
        {t(locale, "stories.section.situation")}
      </h3>
      <p className="text-zinc-800 leading-relaxed mb-8">{situation}</p>

      <h3 className="mono text-xs uppercase tracking-wider text-zinc-600 mb-2">
        {t(locale, "stories.section.built")}
      </h3>
      <p className="text-zinc-800 leading-relaxed mb-8">{built}</p>

      <h3 className="mono text-xs uppercase tracking-wider text-zinc-600 mb-2">
        {t(locale, "stories.section.result")}
      </h3>
      <p className="text-zinc-800 leading-relaxed mb-6">{result}</p>

      <div className="border-y border-cream-200 py-6 my-2">
        <div className="mono text-xs uppercase tracking-wider text-zinc-600 mb-4">
          {t(locale, "stories.numbers.label")}
        </div>
        <dl className="grid grid-cols-3 gap-6">
          {story.metrics.map((m, i) => (
            <div key={i}>
              <dt className="text-2xl sm:text-3xl font-semibold text-amber-600 leading-none mb-2">
                {m.value}
              </dt>
              <dd className="text-xs text-zinc-600 leading-snug">
                {locale === "nl" ? m.label_nl : m.label_en}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
