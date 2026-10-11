/**
 * Confere a conversão entre itens e eventos do calendário da Visão geral.
 *
 *   pnpm test:calendario
 */
import { strict as assert } from "node:assert";
import { novaDataDoEvento, posicaoDoItem } from "../src/lib/calendario";
import { formatarDataItem, type DataItem } from "../src/lib/datas";
import { moverItemSchema } from "../src/lib/validacao/itens";

const local = (s: string) => new Date(s); // "aaaa-mm-ddTHH:mm" = horário local
const item = (d: Partial<DataItem>): DataItem => ({
  data_precisao: "exata",
  data_inicio: null,
  data_fim: null,
  data_hora: null,
  data_hora_fim: null,
  data_periodo: null,
  ...d,
});

let ok = 0;
function caso(nome: string, fn: () => void) {
  fn();
  ok++;
  console.log(`✓ ${nome}`);
}

const diaInteiro = item({ data_inicio: "2026-11-15", data_fim: "2026-11-15" });
const comHorario = item({
  data_inicio: "2026-11-15",
  data_fim: "2026-11-15",
  data_hora: "19:00:00",
  data_hora_fim: "21:00:00",
});
const retiro = item({
  data_precisao: "intervalo",
  data_inicio: "2026-11-13",
  data_fim: "2026-11-15",
  data_hora: "19:00:00",
});

caso("Dia inteiro termina no dia seguinte (fim exclusivo)", () =>
  assert.deepEqual(posicaoDoItem(diaInteiro), {
    inicio: "2026-11-15",
    fim: "2026-11-16",
    diaInteiro: true,
    semHoraFim: false,
    dias: 0,
  }),
);
caso("Com início e término", () => {
  const p = posicaoDoItem(comHorario)!;
  assert.equal(p.inicio, "2026-11-15T19:00");
  assert.equal(p.fim, "2026-11-15T21:00");
});
caso("Intervalo com hora e sem término vai até o fim do último dia", () =>
  assert.equal(posicaoDoItem(retiro)!.fim, "2026-11-15T23:59"),
);
caso("Mês, período e a definir não vão para a grade", () => {
  assert.equal(posicaoDoItem(item({ data_precisao: "mes", data_inicio: "2026-11-01" })), null);
  assert.equal(posicaoDoItem(item({ data_precisao: "a_definir" })), null);
});

caso("Arrastar dia inteiro de 3 dias mantém o intervalo", () =>
  assert.deepEqual(novaDataDoEvento(local("2026-11-20T00:00"), local("2026-11-23T00:00"), true), {
    inicio: "2026-11-20",
    fim: "2026-11-22",
    hora: null,
    horaFim: null,
  }),
);
caso("Puxar para a grade de horas define horário", () =>
  assert.deepEqual(novaDataDoEvento(local("2026-11-15T10:00"), null, false), {
    inicio: "2026-11-15",
    fim: "2026-11-15",
    hora: "10:00",
    horaFim: null,
  }),
);
caso("Redimensionar define o término", () =>
  assert.deepEqual(
    novaDataDoEvento(
      local("2026-11-15T19:00"),
      local("2026-11-15T22:30"),
      false,
      posicaoDoItem(comHorario),
      true,
    ),
    { inicio: "2026-11-15", fim: "2026-11-15", hora: "19:00", horaFim: "22:30" },
  ),
);
caso("Arrastar item sem término continua sem término (e mantém os dias)", () =>
  assert.deepEqual(
    novaDataDoEvento(
      local("2026-11-20T18:00"),
      local("2026-11-22T22:59"),
      false,
      posicaoDoItem(retiro),
    ),
    { inicio: "2026-11-20", fim: "2026-11-22", hora: "18:00", horaFim: null },
  ),
);
caso("Terminar à meia-noite fica no mesmo dia", () =>
  assert.deepEqual(novaDataDoEvento(local("2026-11-15T22:00"), local("2026-11-16T00:00"), false), {
    inicio: "2026-11-15",
    fim: "2026-11-15",
    hora: "22:00",
    horaFim: "23:59",
  }),
);

caso("Validação recusa término antes do início no mesmo dia", () =>
  assert.equal(
    moverItemSchema.safeParse({
      id: "00000000-0000-4000-b000-000000000002",
      inicio: "2026-11-15",
      fim: "2026-11-15",
      hora: "19:00",
      horaFim: "18:00",
    }).success,
    false,
  ),
);

caso("Formato com horário", () => {
  assert.equal(formatarDataItem(comHorario), "15/11/2026 · 19:00–21:00");
  assert.equal(formatarDataItem(retiro), "13/11/2026 19:00 a 15/11/2026");
});

console.log(`\n${ok} verificações passaram.`);
