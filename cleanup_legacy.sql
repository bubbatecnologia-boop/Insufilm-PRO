-- Limpeza das Tabelas Antigas (Legacy)
-- Rode este script para remover as tabelas criadas anteriormente e ficar apenas com a nova arquitetura.

drop table if exists agendamentos cascade;
drop table if exists vendas cascade;
drop table if exists contas cascade;
drop table if exists conta_templates cascade;
drop table if exists produtos cascade;

-- Confirmação visual (opcional)
select 'Tabelas antigas removidas com sucesso' as status;
