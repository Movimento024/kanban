-- Fase 10: horário de início e término nos itens (calendário da Visão geral).
--
-- data_hora passa a ser o horário de início e vale para precisão exata e
-- intervalo (no intervalo, começa em data_inicio e termina em data_fim).
-- data_hora_fim é o horário de término. Sem data_hora = dia inteiro.

alter table public.itens add column data_hora_fim time;

alter table public.itens drop constraint itens_hora_coerente;
alter table public.itens add constraint itens_hora_coerente check (
  (data_hora is null or data_precisao in ('exata', 'intervalo'))
  and (data_hora_fim is null or data_hora is not null)
  and (data_hora_fim is null or data_inicio <> data_fim or data_hora_fim > data_hora)
);

create or replace function public.normalizar_data_item()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  ano integer;
begin
  case new.data_precisao
    when 'a_definir' then
      new.data_inicio := null;
      new.data_fim := null;
      new.data_hora := null;
      new.data_periodo := null;
    when 'exata' then
      new.data_fim := new.data_inicio;
      new.data_periodo := null;
    when 'intervalo' then
      new.data_periodo := null;
    when 'mes' then
      if new.data_inicio is not null then
        new.data_inicio := date_trunc('month', new.data_inicio)::date;
        new.data_fim := (new.data_inicio + interval '1 month - 1 day')::date;
      end if;
      new.data_hora := null;
      new.data_periodo := null;
    when 'periodo' then
      new.data_hora := null;
      if new.data_inicio is not null and new.data_periodo is not null then
        ano := extract(year from new.data_inicio)::integer;
        case new.data_periodo
          when 's1' then new.data_inicio := make_date(ano, 1, 1);  new.data_fim := make_date(ano, 6, 30);
          when 's2' then new.data_inicio := make_date(ano, 7, 1);  new.data_fim := make_date(ano, 12, 31);
          when 't1' then new.data_inicio := make_date(ano, 1, 1);  new.data_fim := make_date(ano, 3, 31);
          when 't2' then new.data_inicio := make_date(ano, 4, 1);  new.data_fim := make_date(ano, 6, 30);
          when 't3' then new.data_inicio := make_date(ano, 7, 1);  new.data_fim := make_date(ano, 9, 30);
          when 't4' then new.data_inicio := make_date(ano, 10, 1); new.data_fim := make_date(ano, 12, 31);
          when 'meio_ano' then new.data_inicio := make_date(ano, 6, 1); new.data_fim := make_date(ano, 8, 31);
        end case;
      end if;
  end case;
  -- Sem horário de início não há término.
  if new.data_hora is null then
    new.data_hora_fim := null;
  end if;
  return new;
end;
$$;
