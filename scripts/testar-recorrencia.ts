/**
 * Confere o cálculo de recorrência (layout Cadência).
 *
 *   pnpm test:recorrencia
 */
import { strict as assert } from "node:assert";
import {
  descreverCadencia,
  ocorrenciasEntre,
  proximaOcorrencia,
  type DadosRecorrencia,
} from "../src/lib/recorrencia";
import { paraData, paraIso } from "../src/lib/datas";

const dia = (iso: string) => paraData(iso);
const prox = (r: DadosRecorrencia, base: string) => {
  const d = proximaOcorrencia(r, dia(base));
  return d && paraIso(d);
};

let ok = 0;
function caso(nome: string, fn: () => void) {
  fn();
  ok++;
  console.log(`✓ ${nome}`);
}

const cast: DadosRecorrencia = {
  recorrencia: "semanal",
  recorrencia_dia_semana: 2,
  recorrencia_estreia: "2026-10-06",
};

caso("024 Cast: toda terça", () => assert.equal(descreverCadencia(cast), "toda terça"));
caso("024 Cast: num sábado, a próxima é a terça seguinte", () =>
  assert.equal(prox(cast, "2026-10-10"), "2026-10-13"),
);
caso("024 Cast: na própria terça, a próxima é hoje", () =>
  assert.equal(prox(cast, "2026-10-13"), "2026-10-13"),
);
caso("024 Cast: antes da estreia, a próxima é a estreia", () =>
  assert.equal(prox(cast, "2026-09-01"), "2026-10-06"),
);
caso("Semanal sem estreia: sábado vira 'todo sábado'", () =>
  assert.equal(
    descreverCadencia({
      recorrencia: "semanal",
      recorrencia_dia_semana: 6,
      recorrencia_estreia: null,
    }),
    "todo sábado",
  ),
);

const quinzenal: DadosRecorrencia = {
  recorrencia: "quinzenal",
  recorrencia_dia_semana: 2,
  recorrencia_estreia: "2026-10-06",
};
caso("Quinzenal: a cada 14 dias a partir da estreia", () => {
  assert.equal(prox(quinzenal, "2026-10-07"), "2026-10-20");
  assert.equal(prox(quinzenal, "2026-10-21"), "2026-11-03");
  assert.equal(descreverCadencia(quinzenal), "a cada 2 semanas, às terças");
});

const mensal: DadosRecorrencia = {
  recorrencia: "mensal",
  recorrencia_dia_semana: null,
  recorrencia_estreia: "2026-01-31",
};
caso("Mensal: dia 31 vira o último dia em meses curtos", () => {
  assert.equal(prox(mensal, "2026-02-01"), "2026-02-28");
  assert.equal(prox(mensal, "2026-03-01"), "2026-03-31");
  assert.equal(descreverCadencia(mensal), "todo dia 31");
});

caso("Sem recorrência: sem próxima data", () =>
  assert.equal(
    prox(
      { recorrencia: "nenhuma", recorrencia_dia_semana: null, recorrencia_estreia: null },
      "2026-10-10",
    ),
    null,
  ),
);

caso("Ocorrências de outubro/2026 do 024 Cast", () =>
  assert.deepEqual(ocorrenciasEntre(cast, dia("2026-10-01"), dia("2026-10-31")).map(paraIso), [
    "2026-10-06",
    "2026-10-13",
    "2026-10-20",
    "2026-10-27",
  ]),
);

console.log(`\n${ok} verificações passaram.`);
