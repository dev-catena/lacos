# Rotas da API - Zontec-Software/thalamus-backend-laravel

**Arquivo:** `routes/api.php`

**Total de rotas:** 1014

---

## GET Routes

### /iot/localizacao/listar

- **Método:** `GET`
- **Controller:** `LocalizacaoController::listarLocalizacao`
- **Linha:** 243

---

### /local

- **Método:** `GET`
- **Controller:** `LocalController::index`
- **Linha:** 249

---

### /verificar/conexao

- **Método:** `GET`
- **Controller:** `UtilidadeController::verificarConexao`
- **Linha:** 253

---

### /cliente-fornecedor

- **Método:** `GET`
- **Controller:** `importacaoOmieController::importarClientesFornecedores`
- **Linha:** 272

---

### /tipo

- **Método:** `GET`
- **Controller:** `importacaoOmieController::importarTipos`
- **Linha:** 273

---

### /etapa

- **Método:** `GET`
- **Controller:** `importacaoOmieController::importarEtapas`
- **Linha:** 274

---

### /familia

- **Método:** `GET`
- **Controller:** `importacaoOmieController::importarFamiliaProdutos`
- **Linha:** 275

---

### /produto

- **Método:** `GET`
- **Controller:** `ProdutoImportacaoController::importarProdutos`
- **Linha:** 276

---

### /projeto

- **Método:** `GET`
- **Controller:** `importacaoOmieController::ImportarProjetos`
- **Linha:** 277

---

### /pedido-compra

- **Método:** `GET`
- **Controller:** `importacaoOmieController::importarPedidoCompra`
- **Linha:** 278

---

### /ordem-producao

- **Método:** `GET`
- **Controller:** `importacaoOmieController::ImportarOrdemProducao`
- **Linha:** 279

---

### /material-roteiro

- **Método:** `GET`
- **Controller:** `OmieEstruturaController::importarEstrutura`
- **Linha:** 280

---

### /conta-receber

- **Método:** `GET`
- **Controller:** `importacaoOmieController::importarContaReceber`
- **Linha:** 281

---

### /conta-pagar

- **Método:** `GET`
- **Controller:** `importacaoOmieController::importarContaPagar`
- **Linha:** 282

---

### /grupo-dre

- **Método:** `GET`
- **Controller:** `importacaoOmieController::importarGrupoDRE`
- **Linha:** 283

---

### /categoria-dre

- **Método:** `GET`
- **Controller:** `importacaoOmieController::importarCategoriaDRE`
- **Linha:** 284

---

### /ncm

- **Método:** `GET`
- **Controller:** `importacaoOmieController::importarNCM`
- **Linha:** 285

---

### /unidade-medida

- **Método:** `GET`
- **Controller:** `importacaoOmieController::importarUnidadeMedida`
- **Linha:** 288

---

### /estoque-local

- **Método:** `GET`
- **Controller:** `EstoqueLocalImportacaoController::importar`
- **Linha:** 289

---

### /sgi/po/{id}/entidade

- **Método:** `GET`
- **Controller:** `SgiController::detalhesEntidade`
- **Parâmetros:**
  - `$id`
- **Linha:** 302

---

### /sgi/requisicao/{id}

- **Método:** `GET`
- **Controller:** `SgiRequisicaoController::InformacoesCabecalhoRequisicao`
- **Parâmetros:**
  - `$id`
- **Linha:** 309

---

### /sgi/unidade-requisitante

- **Método:** `GET`
- **Controller:** `UnidadeRequisitanteController::index`
- **Linha:** 312

---

### /sgi/relatorio/geral/listar

- **Método:** `GET`
- **Controller:** `SgiRelatorioGeralController::FiltroGeralGET`
- **Linha:** 313

---

### /ver-email

- **Método:** `GET`
- **Controller:** `Closure`
- **Linha:** 330

---

### /notificacoes/usuario/{id}

- **Método:** `GET`
- **Controller:** `NotificacaoController::ListarNotificacoesUsuarioSemProtecao`
- **Parâmetros:**
  - `$id`
- **Linha:** 338

---

### /protocolo/entidades/listar

- **Método:** `GET`
- **Controller:** `UtilidadeController::listaEntidadesProjetoPlaProtocolo`
- **Linha:** 339

---

### /sgi/requisicoes/edicao

- **Método:** `GET`
- **Controller:** `SgiController::listarEditaveis`
- **Linha:** 340

---

### locais/listar

- **Método:** `GET`
- **Controller:** `EstoqueLocalController::index`
- **Linha:** 362

---

### /anexos/{entidade}/{id}

- **Método:** `GET`
- **Controller:** `AnexoController::listar`
- **Parâmetros:**
  - `$entidade`
  - `$id`
- **Linha:** 366

---

### /anexo/download/{id}

- **Método:** `GET`
- **Controller:** `AnexoController::download`
- **Parâmetros:**
  - `$id`
- **Linha:** 368

---

### produtos

- **Método:** `GET`
- **Controller:** `AlmoxarifadoController::index`
- **Linha:** 377

---

### produtos/{cod}

- **Método:** `GET`
- **Controller:** `AlmoxarifadoController::view`
- **Parâmetros:**
  - `$cod`
- **Linha:** 378

---

### /listar/{id}

- **Método:** `GET`
- **Controller:** `DemDemandaController::listarDemandasPorSolicitante`
- **Parâmetros:**
  - `$id`
- **Linha:** 386

---

### /logs

- **Método:** `GET`
- **Controller:** `DemLogController::listarLogs`
- **Linha:** 390

---

### /{id}

- **Método:** `GET`
- **Controller:** `DemDemandaController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 392

---

### /itens/{item}/timeline

- **Método:** `GET`
- **Controller:** `DemandaTimelineController::item`
- **Parâmetros:**
  - `$item`
- **Linha:** 400

---

### /requisicao/listar

- **Método:** `GET`
- **Controller:** `CompRequisicaoController::listarRequisicoes`
- **Linha:** 406

---

### /requisicao/listar-permitidas

- **Método:** `GET`
- **Controller:** `CompRequisicaoFiltroController::listarRequisicoesPermitidas`
- **Linha:** 407

---

### /requisicao/{id}

- **Método:** `GET`
- **Controller:** `CompRequisicaoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 408

---

### /requisicao/{id}/concluida

- **Método:** `GET`
- **Controller:** `CompRequisicaoController::showConcluida`
- **Parâmetros:**
  - `$id`
- **Linha:** 409

---

### /requisicao/{id}/demandas

- **Método:** `GET`
- **Controller:** `CompRequisicaoController::getDemandasRequisicao`
- **Parâmetros:**
  - `$id`
- **Linha:** 412

---

### /requisicao/{id}/pdf

- **Método:** `GET`
- **Controller:** `CompPdfController::gerarPdfRequisicao`
- **Parâmetros:**
  - `$id`
- **Linha:** 413

---

### /cotacao/listar

- **Método:** `GET`
- **Controller:** `CompCotacaoController::listarCotacoes`
- **Linha:** 419

---

### /cotacao/{id}

- **Método:** `GET`
- **Controller:** `CompCotacaoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 420

---

### /aprovacao/listar

- **Método:** `GET`
- **Controller:** `CompAprovacaoController::listarAprovacoes`
- **Linha:** 428

---

### /aprovacao/{id}

- **Método:** `GET`
- **Controller:** `CompAprovacaoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 429

---

### /gestao-servico/listar

- **Método:** `GET`
- **Controller:** `CompGestaoServicoController::listarRequisicoes`
- **Linha:** 445

---

### /gestao-servico/{id}

- **Método:** `GET`
- **Controller:** `CompGestaoServicoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 446

---

### /pagamento/listar

- **Método:** `GET`
- **Controller:** `CompGestaoServicoController::listarRequisicoes`
- **Linha:** 453

---

### /pagamento/{id}

- **Método:** `GET`
- **Controller:** `CompGestaoServicoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 454

---

### listar

- **Método:** `GET`
- **Controller:** `DemMotivacaoController::index`
- **Linha:** 459

---

### buscar/{id}

- **Método:** `GET`
- **Controller:** `DemMotivacaoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 461

---

### /tipo/buscar/{tipo}

- **Método:** `GET`
- **Controller:** `DemMotivacaoController::listarMotivacoesPorTipo`
- **Parâmetros:**
  - `$tipo`
- **Linha:** 466

---

### /tipo/listar

- **Método:** `GET`
- **Controller:** `DemMotivacaoController::listarMotivacoesAgrupadasPorTipo`
- **Linha:** 467

---

### /origem/{origemId}

- **Método:** `GET`
- **Controller:** `DemMotivacaoController::listarMotivacoesPorOrigemId`
- **Parâmetros:**
  - `$origemId`
- **Linha:** 468

---

### listar

- **Método:** `GET`
- **Controller:** `DemOrigemController::index`
- **Linha:** 472

---

### buscar/{id}

- **Método:** `GET`
- **Controller:** `DemOrigemController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 474

---

### /{id}/motivacoes

- **Método:** `GET`
- **Controller:** `DemOrigemController::motivacoes`
- **Parâmetros:**
  - `$id`
- **Linha:** 477

---

### listar

- **Método:** `GET`
- **Controller:** `DemFamiliaController::index`
- **Linha:** 482

---

### buscar/{id}

- **Método:** `GET`
- **Controller:** `DemFamiliaController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 484

---

### listar

- **Método:** `GET`
- **Controller:** `DemServicoController::index`
- **Linha:** 491

---

### buscar/{id}

- **Método:** `GET`
- **Controller:** `DemServicoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 493

---

### /listar

- **Método:** `GET`
- **Controller:** `PosVendaController::index`
- **Linha:** 501

---

### /buscar/{id}

- **Método:** `GET`
- **Controller:** `PosVendaController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 503

---

### /listar

- **Método:** `GET`
- **Controller:** `PosVendaDiagnosticoController::index`
- **Linha:** 510

---

### /listar

- **Método:** `GET`
- **Controller:** `PosVendaTarefaController::index`
- **Linha:** 516

---

### /inspecao/buscar/{id}

- **Método:** `GET`
- **Controller:** `InspecaoController::detalhesInspecao`
- **Parâmetros:**
  - `$id`
- **Linha:** 524

---

### /{ativo_id}/parametros

- **Método:** `GET`
- **Controller:** `InspecaoController::parametrosDoAtivo`
- **Parâmetros:**
  - `$ativo_id`
- **Linha:** 525

---

### /{ativo_id}/parametros-inspecao

- **Método:** `GET`
- **Controller:** `InspecaoController::parametrosParaInspecaoDoAtivo`
- **Parâmetros:**
  - `$ativo_id`
- **Linha:** 526

---

### /inspecao/listar

- **Método:** `GET`
- **Controller:** `InspecaoController::listarInspecoesPorCategoria`
- **Linha:** 527

---

### /listar

- **Método:** `GET`
- **Controller:** `GestaoMateriaisParametroController::index`
- **Linha:** 533

---

### /buscar/{id}

- **Método:** `GET`
- **Controller:** `GestaoMateriaisParametroController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 535

---

### /buscar/{protocoloId}

- **Método:** `GET`
- **Controller:** `ProtocoloComentarioController::buscarGruposProtocolo`
- **Parâmetros:**
  - `$protocoloId`
- **Linha:** 546

---

### /buscar/{protocoloId}/plano

- **Método:** `GET`
- **Controller:** `ProtocoloComentarioController::buscarItensProtocoloPlano`
- **Parâmetros:**
  - `$protocoloId`
- **Linha:** 547

---

### /listar

- **Método:** `GET`
- **Controller:** `ProtocoloController::ListarProtocolo`
- **Linha:** 565

---

### /buscar/{id}

- **Método:** `GET`
- **Controller:** `ProtocoloController::BuscarProtocolo`
- **Parâmetros:**
  - `$id`
- **Linha:** 569

---

### /tarefa/listar

- **Método:** `GET`
- **Controller:** `ProtocoloTarefaController::ListarTarefa`
- **Linha:** 571

---

### /tipo/listar

- **Método:** `GET`
- **Controller:** `TipoController::ListarTipo`
- **Linha:** 576

---

### /encerrados/listar

- **Método:** `GET`
- **Controller:** `ProtocoloEncerramentoController::index`
- **Linha:** 578

---

### /listar

- **Método:** `GET`
- **Controller:** `RoteiroController::index`
- **Linha:** 587

---

### /buscar/{id}

- **Método:** `GET`
- **Controller:** `RoteiroController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 589

---

### /produto/{produto_cod}

- **Método:** `GET`
- **Controller:** `EstruturaRoteiroController::obterEstruturaCompleta`
- **Parâmetros:**
  - `$produto_cod`
- **Linha:** 592

---

### /{roteiro_id}/materiais-disponiveis

- **Método:** `GET`
- **Controller:** `RoteiroController::materiaisDisponiveisRoteiro`
- **Parâmetros:**
  - `$roteiro_id`
- **Linha:** 593

---

### /buscar/{produto_cod}

- **Método:** `GET`
- **Controller:** `Rot2RoteiroController::getRoteiro`
- **Parâmetros:**
  - `$produto_cod`
- **Linha:** 598

---

### /etapa

- **Método:** `GET`
- **Controller:** `Rot2EtapaController::index`
- **Linha:** 600

---

### /etapa/{id}

- **Método:** `GET`
- **Controller:** `Rot2EtapaController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 600

---

### /tipo

- **Método:** `GET`
- **Controller:** `Rot2TipoEtapaController::index`
- **Linha:** 601

---

### /tipo/{id}

- **Método:** `GET`
- **Controller:** `Rot2TipoEtapaController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 601

---

### /orientacao

- **Método:** `GET`
- **Controller:** `Rot2OrientacaoController::index`
- **Linha:** 602

---

### /orientacao/{id}

- **Método:** `GET`
- **Controller:** `Rot2OrientacaoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 602

---

### /instrucao

- **Método:** `GET`
- **Controller:** `Rot2InstrucaoController::index`
- **Linha:** 603

---

### /instrucao/{id}

- **Método:** `GET`
- **Controller:** `Rot2InstrucaoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 603

---

### /buscar/{produto_cod}/oficial

- **Método:** `GET`
- **Controller:** `Rot2RoteiroController::getRoteiroOficial`
- **Parâmetros:**
  - `$produto_cod`
- **Linha:** 609

---

### /buscar/{produto_cod}/edicao

- **Método:** `GET`
- **Controller:** `Rot2RoteiroController::getRoteiroEdicao`
- **Parâmetros:**
  - `$produto_cod`
- **Linha:** 610

---

### /listar

- **Método:** `GET`
- **Controller:** `ParametroController::index`
- **Linha:** 631

---

### /buscar/{id}

- **Método:** `GET`
- **Controller:** `ParametroController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 633

---

### /todas

- **Método:** `GET`
- **Controller:** `ParametroController::all`
- **Linha:** 636

---

### /listar

- **Método:** `GET`
- **Controller:** `GabaritoController::index`
- **Linha:** 641

---

### /buscar/{id}

- **Método:** `GET`
- **Controller:** `GabaritoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 643

---

### /listar

- **Método:** `GET`
- **Controller:** `OportunidadeController::index`
- **Linha:** 653

---

### /buscar/{id}

- **Método:** `GET`
- **Controller:** `OportunidadeController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 655

---

### /listar

- **Método:** `GET`
- **Controller:** `OptOportunidadeController::index`
- **Linha:** 672

---

### /buscar/{id}

- **Método:** `GET`
- **Controller:** `OptOportunidadeController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 674

---

### /listar

- **Método:** `GET`
- **Controller:** `OptOportunidadeTarefaController::index`
- **Linha:** 684

---

### /listar

- **Método:** `GET`
- **Controller:** `PropostaComercialController::index`
- **Linha:** 690

---

### /buscar/{id}

- **Método:** `GET`
- **Controller:** `PropostaComercialController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 691

---

### /{propostaID}/anexos

- **Método:** `GET`
- **Controller:** `PropostaComercialAnexoController::index`
- **Parâmetros:**
  - `$propostaID`
- **Linha:** 694

---

### /item/{itemId}/anexos

- **Método:** `GET`
- **Controller:** `PropostaComercialItemAnexoController::index`
- **Parâmetros:**
  - `$itemId`
- **Linha:** 696

---

### /produtos

- **Método:** `GET`
- **Controller:** `CrmProducaoController::listaProdutos`
- **Linha:** 701

---

### /ops-em-andamento

- **Método:** `GET`
- **Controller:** `CrmProducaoController::listaOpsEmAndamento`
- **Linha:** 702

---

### /compras-em-andamento

- **Método:** `GET`
- **Controller:** `CrmProducaoController::listaComprasEmAndamento`
- **Linha:** 703

---

### /ops-para-tratar

- **Método:** `GET`
- **Controller:** `CrmProducaoController::listaOpsParaTratar`
- **Linha:** 704

---

### /ops-para-tratar/estrutura

- **Método:** `GET`
- **Controller:** `CrmProducaoController::listaEstruturaDasOpsParaTratar`
- **Linha:** 705

---

### /ops-tratadas-nao-iniciadas

- **Método:** `GET`
- **Controller:** `CrmProducaoController::listaOpsTratadasNaoIniciadas`
- **Linha:** 706

---

### /ops-tratadas-iniciadas

- **Método:** `GET`
- **Controller:** `CrmProducaoController::listaOpsTratadasIniciadas`
- **Linha:** 707

---

### /listar

- **Método:** `GET`
- **Controller:** `PropostaComercialTarefaController::index`
- **Linha:** 720

---

### /listar

- **Método:** `GET`
- **Controller:** `ExpedicaoController::index`
- **Linha:** 726

---

### /buscar/{id}

- **Método:** `GET`
- **Controller:** `ExpedicaoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 728

---

### /produto/{produto_cod}

- **Método:** `GET`
- **Controller:** `EstruturaProdutoController::BuscarEstruturaCompleta`
- **Parâmetros:**
  - `$produto_cod`
- **Linha:** 733

---

### /cliente-temp/listar

- **Método:** `GET`
- **Controller:** `ClienteTempController::index`
- **Linha:** 746

---

### /cliente-temp/buscar/{id}

- **Método:** `GET`
- **Controller:** `ClienteTempController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 748

---

### /cliente/cliente-temp/listar

- **Método:** `GET`
- **Controller:** `ClienteTempController::clientesUnidos`
- **Linha:** 751

---

### /usuario/desativados

- **Método:** `GET`
- **Controller:** `UserController::usuariosDesativados`
- **Linha:** 755

---

### /objetivo-estrategico/listar

- **Método:** `GET`
- **Controller:** `ObjetivoEstrategicoController::index`
- **Linha:** 756

---

### /material-utilizado/tipos/listar

- **Método:** `GET`
- **Controller:** `MaterialUtilizadoController::listarTipos`
- **Linha:** 759

---

### /verbos/listar

- **Método:** `GET`
- **Controller:** `VerboController::index`
- **Linha:** 770

---

### /verbos/buscar/{id}

- **Método:** `GET`
- **Controller:** `VerboController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 772

---

### /objetos/listar

- **Método:** `GET`
- **Controller:** `ObjetoController::index`
- **Linha:** 777

---

### /objetos/buscar/{id}

- **Método:** `GET`
- **Controller:** `ObjetoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 779

---

### /locais/listar

- **Método:** `GET`
- **Controller:** `LocalCodController::index`
- **Linha:** 784

---

### /locais/buscar/{id}

- **Método:** `GET`
- **Controller:** `LocalCodController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 786

---

### /codificacoes/listar

- **Método:** `GET`
- **Controller:** `CodificacaoController::index`
- **Linha:** 791

---

### /codificacoes/buscar/{id}

- **Método:** `GET`
- **Controller:** `CodificacaoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 793

---

### /campos/listar

- **Método:** `GET`
- **Controller:** `CampoProdutoController::listarCamposPossiveis`
- **Linha:** 814

---

### /campos/listar/lista

- **Método:** `GET`
- **Controller:** `CampoProdutoController::listarListaCampos`
- **Linha:** 819

---

### /listar/insumos

- **Método:** `GET`
- **Controller:** `ProdutoController::listarInsumos`
- **Linha:** 821

---

### /listar/ferramentas

- **Método:** `GET`
- **Controller:** `ProdutoController::listarFerramentas`
- **Linha:** 822

---

### /sem-categorizacao

- **Método:** `GET`
- **Controller:** `SemCategorizacaoProdutoController::index`
- **Linha:** 826

---

### /listar

- **Método:** `GET`
- **Controller:** `FamiliaProdutoController::index`
- **Linha:** 832

---

### /buscar/{id}

- **Método:** `GET`
- **Controller:** `FamiliaProdutoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 834

---

### /unidade-medida/listar

- **Método:** `GET`
- **Controller:** `UnidadeMedidaProdutoController::index`
- **Linha:** 840

---

### /unidade-medida/buscar/{id}

- **Método:** `GET`
- **Controller:** `UnidadeMedidaProdutoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 842

---

### /ncm/listar

- **Método:** `GET`
- **Controller:** `NCMController::listarNCM`
- **Linha:** 846

---

### /familia/listar

- **Método:** `GET`
- **Controller:** `FamiliaProdutoController::listarFamilia`
- **Linha:** 849

---

### /produto/familia/listar

- **Método:** `GET`
- **Controller:** `FamiliaProdutoController::listarFamilia`
- **Linha:** 850

---

### /produto/tipo/listar

- **Método:** `GET`
- **Controller:** `ProdutoTipoProdutoController::listarTipoProduto`
- **Linha:** 853

---

### /protecao

- **Método:** `GET`
- **Controller:** `UtilidadeController::testeProtecao`
- **Linha:** 857

---

### /pessoa/usuario

- **Método:** `GET`
- **Controller:** `PessoaController::showPessoaPorUsuario`
- **Linha:** 858

---

### /pessoa/usuario/buscar

- **Método:** `GET`
- **Controller:** `PessoaController::buscarPessoaPorUsuario`
- **Linha:** 859

---

### /pessoa/desativadas

- **Método:** `GET`
- **Controller:** `PessoaController::pessoasDesativadas`
- **Linha:** 860

---

### /dispositivo

- **Método:** `GET`
- **Controller:** `DispositivoController::index`
- **Linha:** 876

---

### /dispositivo/{id}/detalhes

- **Método:** `GET`
- **Controller:** `DispositivoController::detalhes`
- **Parâmetros:**
  - `$id`
- **Linha:** 877

---

### /verificar/dispositivo/{codigo}

- **Método:** `GET`
- **Controller:** `DispositivoController::show`
- **Parâmetros:**
  - `$codigo`
- **Linha:** 878

---

### /pcm-producao/{estado}

- **Método:** `GET`
- **Controller:** `ProducaoControleController::listarProducaoPCM`
- **Parâmetros:**
  - `$estado`
- **Linha:** 887

---

### /produto/original-editado/{produto_cod}

- **Método:** `GET`
- **Controller:** `ProdutoStagingController::produtoOriginaleEditado`
- **Parâmetros:**
  - `$produto_cod`
- **Linha:** 902

---

### /produto/alteracoes/{produto_cod}

- **Método:** `GET`
- **Controller:** `ProdutoStagingController::buscarAlteracoesPendentes`
- **Parâmetros:**
  - `$produto_cod`
- **Linha:** 907

---

### /produto/em-edicao

- **Método:** `GET`
- **Controller:** `ProdutoStagingController::produtoEmEdicao`
- **Linha:** 908

---

### /produto-filtrar

- **Método:** `GET`
- **Controller:** `ProdutoController::produtosFiltrados`
- **Linha:** 915

---

### /produto-buscar/{produto_cod}

- **Método:** `GET`
- **Controller:** `ProdutoController::produtoPorCod`
- **Parâmetros:**
  - `$produto_cod`
- **Linha:** 916

---

### /base/recursos-humanos

- **Método:** `GET`
- **Controller:** `UtilidadeController::dadosBasicosRecursosHumanos`
- **Linha:** 919

---

### /empresas-contrante/listar

- **Método:** `GET`
- **Controller:** `EmpresasContratanteController::index`
- **Linha:** 921

---

### /empresas-contrante/buscar/{id}

- **Método:** `GET`
- **Controller:** `EmpresasContratanteController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 923

---

### /cor-raca/listar

- **Método:** `GET`
- **Controller:** `CorRacaController::index`
- **Linha:** 927

---

### /cor-raca/buscar/{id}

- **Método:** `GET`
- **Controller:** `CorRacaController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 929

---

### /escolaridade/listar

- **Método:** `GET`
- **Controller:** `EscolaridadeController::index`
- **Linha:** 933

---

### /escolaridade/buscar/{id}

- **Método:** `GET`
- **Controller:** `EscolaridadeController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 935

---

### /estado-civil/listar

- **Método:** `GET`
- **Controller:** `EstadoCivilController::index`
- **Linha:** 939

---

### /estado-civil/buscar/{id}

- **Método:** `GET`
- **Controller:** `EstadoCivilController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 941

---

### /religiao/listar

- **Método:** `GET`
- **Controller:** `ReligiaoController::index`
- **Linha:** 945

---

### /religiao/buscar/{id}

- **Método:** `GET`
- **Controller:** `ReligiaoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 947

---

### /tamanho/listar

- **Método:** `GET`
- **Controller:** `TamanhoController::index`
- **Linha:** 951

---

### /tamanho/buscar/{id}

- **Método:** `GET`
- **Controller:** `TamanhoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 953

---

### /tipo-conta/listar

- **Método:** `GET`
- **Controller:** `ContaTipoController::index`
- **Linha:** 957

---

### /tipo-conta/buscar/{id}

- **Método:** `GET`
- **Controller:** `ContaTipoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 959

---

### /parentesco/listar

- **Método:** `GET`
- **Controller:** `ParentescoController::index`
- **Linha:** 963

---

### /parentesco/buscar/{id}

- **Método:** `GET`
- **Controller:** `ParentescoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 965

---

### /tipo-graduacao/listar

- **Método:** `GET`
- **Controller:** `GraduacaoTipoController::index`
- **Linha:** 969

---

### /tipo-graduacao/buscar/{id}

- **Método:** `GET`
- **Controller:** `GraduacaoTipoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 971

---

### /regional/listar

- **Método:** `GET`
- **Controller:** `RegionalController::index`
- **Linha:** 975

---

### /regional/buscar/{id}

- **Método:** `GET`
- **Controller:** `RegionalController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 977

---

### /motivos

- **Método:** `GET`
- **Controller:** `MotivoDemissaoController::index`
- **Linha:** 1011

---

### /motivos/{id}

- **Método:** `GET`
- **Controller:** `MotivoDemissaoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1012

---

### /pessoa

- **Método:** `GET`
- **Controller:** `PessoaController::index`
- **Linha:** 1018

---

### /pessoa/vendedor

- **Método:** `GET`
- **Controller:** `PessoaController::listaVendedores`
- **Linha:** 1019

---

### /filtrar/pessoa

- **Método:** `GET`
- **Controller:** `PessoaController::indexFiltrado`
- **Linha:** 1020

---

### /filtrar/pessoa-sem-usuario

- **Método:** `GET`
- **Controller:** `PessoaController::indexPessoaSemUsuario`
- **Linha:** 1021

---

### /pessoa/convidado

- **Método:** `GET`
- **Controller:** `PessoaController::indexConvidado`
- **Linha:** 1022

---

### /pessoa/{id}

- **Método:** `GET`
- **Controller:** `PessoaController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1035

---

### /comemoracao/mes/{mes}

- **Método:** `GET`
- **Controller:** `PessoaController::datasComemorativas`
- **Parâmetros:**
  - `$mes`
- **Linha:** 1039

---

### /pessoas/aniversariantes

- **Método:** `GET`
- **Controller:** `PessoaController::aniversariantesPorMes`
- **Linha:** 1040

---

### /usuario/lideranca/listar

- **Método:** `GET`
- **Controller:** `UserController::ListarLiderancas`
- **Linha:** 1044

---

### /movimentacao-material/op/{op_cod}/setores

- **Método:** `GET`
- **Controller:** `MovimentacaoMaterialController::buscaMateriaisParadosPorOP`
- **Parâmetros:**
  - `$op_cod`
- **Linha:** 1049

---

### /movimentacao-material/op

- **Método:** `GET`
- **Controller:** `MovimentacaoMaterialController::listaMateriaisPorSetorDeOPsEmProducao`
- **Linha:** 1050

---

### /notificacoes/usuario

- **Método:** `GET`
- **Controller:** `NotificacaoController::ListarNotificacoesUsuario`
- **Linha:** 1054

---

### /projeto/encerrados/listar

- **Método:** `GET`
- **Controller:** `EncerramentoProjetoController::index`
- **Linha:** 1060

---

### /cargo/listar

- **Método:** `GET`
- **Controller:** `CargoController::ListarCargos`
- **Linha:** 1074

---

### /cargo/hierarquico

- **Método:** `GET`
- **Controller:** `CargoController::ListarCargoHierarquicamenteComPessoas`
- **Linha:** 1075

---

### /estrategico

- **Método:** `GET`
- **Controller:** `SetorController::ListarSetorEstrategico`
- **Linha:** 1085

---

### /operacional

- **Método:** `GET`
- **Controller:** `SetorController::ListarSetorOperacional`
- **Linha:** 1086

---

### /hierarquico

- **Método:** `GET`
- **Controller:** `SetorController::ListarSetorHierarquicamenteComUsuario`
- **Linha:** 1087

---

### /montagem

- **Método:** `GET`
- **Controller:** `SetorController::ListarSetorMontagem`
- **Linha:** 1088

---

### /todos

- **Método:** `GET`
- **Controller:** `SetorController::listarTodosSetores`
- **Linha:** 1090

---

### /

- **Método:** `GET`
- **Controller:** `SetorController::index`
- **Linha:** 1091

---

### /{id}

- **Método:** `GET`
- **Controller:** `SetorController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1093

---

### /apontamento/montagem/lista

- **Método:** `GET`
- **Controller:** `VisualizacaoMontagemController::OrdemProducaoAtivasMontagem`
- **Linha:** 1106

---

### /pcm/{id}/pdf/

- **Método:** `GET`
- **Controller:** `PcmController::GerarPDF`
- **Parâmetros:**
  - `$id`
- **Linha:** 1109

---

### /status-edicao/listar

- **Método:** `GET`
- **Controller:** `StatusEdicaoController::ListarStatus`
- **Linha:** 1139

---

### /categoria/listar/setor

- **Método:** `GET`
- **Controller:** `CategoriaDREController::listaCategoriaSetor`
- **Linha:** 1146

---

### /categoria/listar

- **Método:** `GET`
- **Controller:** `CategoriaDREController::ListarCategoriaDRE`
- **Linha:** 1148

---

### /excel/novo

- **Método:** `GET`
- **Controller:** `OrcamentoDREController::GerarExcelCategoria`
- **Linha:** 1149

---

### /historico/arquivos

- **Método:** `GET`
- **Controller:** `OrcamentoDREController::ListarHistoricoArquivo`
- **Linha:** 1152

---

### /categoria/listarProdutos/{id}

- **Método:** `GET`
- **Controller:** `CategoriaDREController::getProdutosCategoriaDRE`
- **Parâmetros:**
  - `$id`
- **Linha:** 1155

---

### /grupo/listar

- **Método:** `GET`
- **Controller:** `EstruturaDREController::ListarGrupo`
- **Linha:** 1162

---

### /subGrupo/listar/{id}

- **Método:** `GET`
- **Controller:** `EstruturaDREController::ListarSubGrupo`
- **Parâmetros:**
  - `$id`
- **Linha:** 1163

---

### /projeto/orcamento/listar

- **Método:** `GET`
- **Controller:** `FinanceiroOrcamentoProjetoController::ListarOrcamentoProjeto`
- **Linha:** 1167

---

### exercicio-financeiro/listar

- **Método:** `GET`
- **Controller:** `ExercicioFInanceiroController::index`
- **Linha:** 1169

---

### ordem-producao/injecao/existente

- **Método:** `GET`
- **Controller:** `OpInjecaoController::OrdemProducaoComTrabalho`
- **Linha:** 1179

---

### ordem-producao/injecao/pendente

- **Método:** `GET`
- **Controller:** `OpInjecaoController::OrdemProducaoEmAbertoInjetora`
- **Linha:** 1180

---

### ordem-producao/injecao/buscar/{id}

- **Método:** `GET`
- **Controller:** `OpInjecaoController::OrdemProducaoBuscar`
- **Parâmetros:**
  - `$id`
- **Linha:** 1181

---

### ordem-producao/trabalho/listar/{id}

- **Método:** `GET`
- **Controller:** `OpInjecaoController::TrabalhoInjecaoOp`
- **Parâmetros:**
  - `$id`
- **Linha:** 1182

---

### injecao/maquina/listar

- **Método:** `GET`
- **Controller:** `MaquinaController::ListarMaquina`
- **Linha:** 1184

---

### injecao/informacoes

- **Método:** `GET`
- **Controller:** `GestaoInjetoraController::PainelInformacoes`
- **Linha:** 1192

---

### injecao/mock

- **Método:** `GET`
- **Controller:** `GestaoInjetoraController::PainelInformacoesMock`
- **Linha:** 1193

---

### trabalho/pausa/buscar/{id}

- **Método:** `GET`
- **Controller:** `InjetoraTrabalhoController::BuscarPausa`
- **Parâmetros:**
  - `$id`
- **Linha:** 1199

---

### injecao/motivo/listar

- **Método:** `GET`
- **Controller:** `InjetoraMotivoController::ListarMotivo`
- **Linha:** 1201

---

### injecao/validar/qrcode/{qrcode}

- **Método:** `GET`
- **Controller:** `OpInjecaoController::ValidarQrCodeInjecao`
- **Parâmetros:**
  - `$qrcode`
- **Linha:** 1206

---

### injecao/servico

- **Método:** `GET`
- **Controller:** `InjetoraServicoController::index`
- **Linha:** 1208

---

### /programa/listar

- **Método:** `GET`
- **Controller:** `ProgramaController::ListarPrograma`
- **Linha:** 1217

---

### /programa/buscar/{id}

- **Método:** `GET`
- **Controller:** `ProgramaController::BuscarPrograma`
- **Parâmetros:**
  - `$id`
- **Linha:** 1222

---

### /planoAcao/listar

- **Método:** `GET`
- **Controller:** `PlanoAcaoController::ListarPlanoAcao`
- **Linha:** 1224

---

### /planoAcao/buscar/{id}

- **Método:** `GET`
- **Controller:** `PlanoAcaoController::BuscarPlanoAcaoMaisTarefa`
- **Parâmetros:**
  - `$id`
- **Linha:** 1227

---

### /pcm/impacto-viabilidade

- **Método:** `GET`
- **Controller:** `ImpactoViabilidadeController::ListarImpactoViabilidade`
- **Linha:** 1240

---

### /pcm/listar

- **Método:** `GET`
- **Controller:** `PcmController::ListarPcm`
- **Linha:** 1242

---

### /pcm/buscar/{id}

- **Método:** `GET`
- **Controller:** `PcmController::BuscarPcm`
- **Parâmetros:**
  - `$id`
- **Linha:** 1243

---

### /pedidos-edicao

- **Método:** `GET`
- **Controller:** `PcmPedidoEdicaoController::index`
- **Linha:** 1248

---

### /pedidos-edicao/{id}

- **Método:** `GET`
- **Controller:** `PcmPedidoEdicaoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1248

---

### /planoacao-projeto/listar/sem-programa

- **Método:** `GET`
- **Controller:** `PlanoAcaoController::ListarProjetosEPlanoAcaoSemPrograma`
- **Linha:** 1253

---

### /planoacao-projeto/listar/sem-pcm

- **Método:** `GET`
- **Controller:** `PlanoAcaoController::ListarProjetoEPlanoAcaoSemPcm`
- **Linha:** 1254

---

### /filtro/responsavel

- **Método:** `GET`
- **Controller:** `GestaoProjetoController::ListarResponsavel`
- **Linha:** 1263

---

### /filtro/gerente

- **Método:** `GET`
- **Controller:** `GestaoProjetoController::ListarGerente`
- **Linha:** 1264

---

### /filtro/projeto

- **Método:** `GET`
- **Controller:** `GestaoProjetoController::ListarProjeto`
- **Linha:** 1265

---

### /projeto/listar

- **Método:** `GET`
- **Controller:** `ProjetoController::ListarProjeto`
- **Linha:** 1277

---

### /projeto/usuario/{id}

- **Método:** `GET`
- **Controller:** `ProjetoController::ListarProjetoUsuario`
- **Parâmetros:**
  - `$id`
- **Linha:** 1278

---

### /projeto/indicadores

- **Método:** `GET`
- **Controller:** `ProjetoController::listarProjetosComIndicadores`
- **Linha:** 1279

---

### /projeto/{id}/demandas

- **Método:** `GET`
- **Controller:** `ProjetoController::ListarDemandasProjeto`
- **Parâmetros:**
  - `$id`
- **Linha:** 1280

---

### /projeto/{id}

- **Método:** `GET`
- **Controller:** `ProjetoController::BuscarProjetoPorId`
- **Parâmetros:**
  - `$id`
- **Linha:** 1281

---

### /projetos/demandas

- **Método:** `GET`
- **Controller:** `DemandasTemporariasController::index`
- **Linha:** 1285

---

### /projetos/demandas/{id}

- **Método:** `GET`
- **Controller:** `DemandasTemporariasController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1285

---

### /sprint/buscar/{id}

- **Método:** `GET`
- **Controller:** `SprintController::BuscarSprintTarefa`
- **Parâmetros:**
  - `$id`
- **Linha:** 1296

---

### ativos/local-fisico/{id}

- **Método:** `GET`
- **Controller:** `AtivosController::BuscarAtivosLocal`
- **Parâmetros:**
  - `$id`
- **Linha:** 1309

---

### unidade/locais

- **Método:** `GET`
- **Controller:** `LocalController::BuscarLocaisUnidade`
- **Linha:** 1311

---

### inventario/inventario-local/{id}

- **Método:** `GET`
- **Controller:** `InventarioController::BuscarAtivosPorInventarioLocal`
- **Parâmetros:**
  - `$id`
- **Linha:** 1313

---

### inventario/buscar/{id}

- **Método:** `GET`
- **Controller:** `InventarioController::BuscarInventario`
- **Parâmetros:**
  - `$id`
- **Linha:** 1314

---

### inventario/unidade/{id}

- **Método:** `GET`
- **Controller:** `InventarioController::BuscarInventarioPorUnidade`
- **Parâmetros:**
  - `$id`
- **Linha:** 1318

---

### projetos/omie/listar

- **Método:** `GET`
- **Controller:** `ProjetoController::ListarProjetoOmie`
- **Linha:** 1335

---

### ordem-producao/ativas

- **Método:** `GET`
- **Controller:** `ProducaoController::OrdemProducaoAtivas`
- **Linha:** 1336

---

### ativos/listar

- **Método:** `GET`
- **Controller:** `AtivosController::ListarAtivos`
- **Linha:** 1338

---

### ativos/listar/usuario/{id}

- **Método:** `GET`
- **Controller:** `AtivosController::ListarAtivosUsuario`
- **Parâmetros:**
  - `$id`
- **Linha:** 1340

---

### categoria/listar

- **Método:** `GET`
- **Controller:** `CategoriaController::ListarCategoria`
- **Linha:** 1356

---

### categoria/superior

- **Método:** `GET`
- **Controller:** `CategoriaController::ListarCategoriaSuperior`
- **Linha:** 1357

---

### local-fisico/listar

- **Método:** `GET`
- **Controller:** `LocalFisicoController::ListarLocalFisico`
- **Linha:** 1363

---

### local-fisico/buscar/unidade/{id}

- **Método:** `GET`
- **Controller:** `LocalFisicoController::ListarLocalFisicoPorUnidade`
- **Parâmetros:**
  - `$id`
- **Linha:** 1364

---

### motivo-alerta/listar

- **Método:** `GET`
- **Controller:** `MotivoAlertaController::ListarMotivoAlerta`
- **Linha:** 1369

---

### status-ativo/listar

- **Método:** `GET`
- **Controller:** `StatusAtivoController::ListarStatusAtivo`
- **Linha:** 1374

---

### /buscar/familia-produto-vendido

- **Método:** `GET`
- **Controller:** `OmieController::BuscarFamiliaProdutosVendidos`
- **Linha:** 1386

---

### /indicador

- **Método:** `GET`
- **Controller:** `IndicadorController::index`
- **Linha:** 1390

---

### /indicador/{id}

- **Método:** `GET`
- **Controller:** `IndicadorController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1392

---

### /omie/oportunidade/ano

- **Método:** `GET`
- **Controller:** `OmieOportunidadeController::anosComOportunidade`
- **Linha:** 1407

---

### /menu/home

- **Método:** `GET`
- **Controller:** `FuncionalidadeController::menuHome`
- **Linha:** 1420

---

### /menu/estrutura

- **Método:** `GET`
- **Controller:** `FuncionalidadeController::menuEstruturaCompleta`
- **Linha:** 1421

---

### /menu/estrutura/{id}

- **Método:** `GET`
- **Controller:** `FuncionalidadeController::menuEstruturaHomeSelecionado`
- **Parâmetros:**
  - `$id`
- **Linha:** 1422

---

### /os/motivo/listar

- **Método:** `GET`
- **Controller:** `OrdemServicoMotivoController::ListarMotivo`
- **Linha:** 1440

---

### /os/porta-molde/listar

- **Método:** `GET`
- **Controller:** `OrdemServicoPortaMoldeController::ListarPortaMolde`
- **Linha:** 1453

---

### /os/objeto-servico/listar

- **Método:** `GET`
- **Controller:** `OrdemServicoObjetoController::ListarObjetoServico`
- **Linha:** 1457

---

### /os/tipo-servico/listar

- **Método:** `GET`
- **Controller:** `OrdemServicoTipoController::ListarTipoServico`
- **Linha:** 1461

---

### /os/material-trabalho/listar

- **Método:** `GET`
- **Controller:** `OrdemServicoMaterialController::ListarMaterial`
- **Linha:** 1466

---

### marca

- **Método:** `GET`
- **Controller:** `MarcaController::index`
- **Linha:** 1475

---

### marca/{id}

- **Método:** `GET`
- **Controller:** `MarcaController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1475

---

### modelo

- **Método:** `GET`
- **Controller:** `ModeloController::index`
- **Linha:** 1476

---

### modelo/{id}

- **Método:** `GET`
- **Controller:** `ModeloController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1476

---

### operadora

- **Método:** `GET`
- **Controller:** `OperadoraController::index`
- **Linha:** 1477

---

### operadora/{id}

- **Método:** `GET`
- **Controller:** `OperadoraController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1477

---

### /

- **Método:** `GET`
- **Controller:** `OrdemServicoAtivosExternosController::index`
- **Linha:** 1480

---

### //{id}

- **Método:** `GET`
- **Controller:** `OrdemServicoAtivosExternosController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1480

---

### servico

- **Método:** `GET`
- **Controller:** `ServicoAtivoExternoController::index`
- **Linha:** 1487

---

### servico/{id}

- **Método:** `GET`
- **Controller:** `ServicoAtivoExternoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1487

---

### /os/assistencia-tecnica

- **Método:** `GET`
- **Controller:** `AssistenciaTecnicaController::index`
- **Linha:** 1493

---

### /os/assistencia-tecnica/{id}

- **Método:** `GET`
- **Controller:** `AssistenciaTecnicaController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1495

---

### /os/manutencao

- **Método:** `GET`
- **Controller:** `ManutencaoController::index`
- **Linha:** 1501

---

### /os/manutencao/{id}

- **Método:** `GET`
- **Controller:** `ManutencaoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1503

---

### /os/manutencao/listar/usuario/{id}

- **Método:** `GET`
- **Controller:** `ManutencaoController::ListarManutencaoUsuario`
- **Parâmetros:**
  - `$id`
- **Linha:** 1504

---

### /os/retrabalho

- **Método:** `GET`
- **Controller:** `RetrabalhoController::index`
- **Linha:** 1509

---

### /os/retrabalho/{id}

- **Método:** `GET`
- **Controller:** `RetrabalhoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1510

---

### /retrabalho/listar/usuario/{id}

- **Método:** `GET`
- **Controller:** `RetrabalhoController::ListarRetrabalhoUsuario`
- **Parâmetros:**
  - `$id`
- **Linha:** 1511

---

### /usinagem/listar

- **Método:** `GET`
- **Controller:** `UsinagemController::ListarUsinagem`
- **Linha:** 1516

---

### /usinagem/listar/usuario/{id}

- **Método:** `GET`
- **Controller:** `UsinagemController::ListarUsinagemUsuario`
- **Parâmetros:**
  - `$id`
- **Linha:** 1517

---

### /usinagem/buscar/{id}

- **Método:** `GET`
- **Controller:** `UsinagemController::BuscarUsinagem`
- **Parâmetros:**
  - `$id`
- **Linha:** 1518

---

### /os/{id}/materiais

- **Método:** `GET`
- **Controller:** `OrdemServicoMaterialController::listaMateriaisPorIdOs`
- **Parâmetros:**
  - `$id`
- **Linha:** 1525

---

### /os

- **Método:** `GET`
- **Controller:** `OrdemServicoController::index`
- **Linha:** 1533

---

### /os/{id}

- **Método:** `GET`
- **Controller:** `OrdemServicoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1535

---

### /acesso

- **Método:** `GET`
- **Controller:** `AcessoController::index`
- **Linha:** 1540

---

### /acesso/cartao/{id}

- **Método:** `GET`
- **Controller:** `AcessoController::showByCard`
- **Parâmetros:**
  - `$id`
- **Linha:** 1541

---

### /acesso/filtro

- **Método:** `GET`
- **Controller:** `AcessoController::filtro`
- **Linha:** 1542

---

### /visitante

- **Método:** `GET`
- **Controller:** `PessoaVisitanteController::index`
- **Linha:** 1547

---

### /visitante/{id}

- **Método:** `GET`
- **Controller:** `PessoaVisitanteController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1549

---

### /local/{id}

- **Método:** `GET`
- **Controller:** `LocalController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1556

---

### /local/{id}/acessos

- **Método:** `GET`
- **Controller:** `LocalController::listaAcessos`
- **Parâmetros:**
  - `$id`
- **Linha:** 1557

---

### /local/{id}/acessos-hoje

- **Método:** `GET`
- **Controller:** `LocalController::listaAcessosHoje`
- **Parâmetros:**
  - `$id`
- **Linha:** 1558

---

### /acesso

- **Método:** `GET`
- **Controller:** `AcessoController::index`
- **Linha:** 1564

---

### /meta

- **Método:** `GET`
- **Controller:** `MetaController::index`
- **Linha:** 1571

---

### /meta/{id}

- **Método:** `GET`
- **Controller:** `MetaController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1573

---

### /upload/nf/{id}

- **Método:** `GET`
- **Controller:** `NotaFiscalController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1580

---

### /sistema

- **Método:** `GET`
- **Controller:** `SistemaController::index`
- **Linha:** 1589

---

### /sistema/{id}

- **Método:** `GET`
- **Controller:** `SistemaController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1591

---

### /sistema/{id}/funcionalidades

- **Método:** `GET`
- **Controller:** `SistemaController::listaFuncSistema`
- **Parâmetros:**
  - `$id`
- **Linha:** 1594

---

### /grupo

- **Método:** `GET`
- **Controller:** `GrupoController::index`
- **Linha:** 1598

---

### /grupo/{id}

- **Método:** `GET`
- **Controller:** `GrupoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1600

---

### /grupo/{id}/funcionalidades

- **Método:** `GET`
- **Controller:** `GrupoController::listaFuncGrupo`
- **Parâmetros:**
  - `$id`
- **Linha:** 1603

---

### /grupo/{id}/usuarios

- **Método:** `GET`
- **Controller:** `GrupoController::listaUsuariosGrupo`
- **Parâmetros:**
  - `$id`
- **Linha:** 1605

---

### /usuario/{id}/grupos

- **Método:** `GET`
- **Controller:** `GrupoController::listaGruposUsuario`
- **Parâmetros:**
  - `$id`
- **Linha:** 1610

---

### /seguimento

- **Método:** `GET`
- **Controller:** `SeguimentoController::index`
- **Linha:** 1619

---

### /usuario/{id}/funcionalidades

- **Método:** `GET`
- **Controller:** `AuthController::usuFunc`
- **Parâmetros:**
  - `$id`
- **Linha:** 1625

---

### /usuario

- **Método:** `GET`
- **Controller:** `AuthController::index`
- **Linha:** 1627

---

### /usuario/{id}

- **Método:** `GET`
- **Controller:** `AuthController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1629

---

### /funcionalidade

- **Método:** `GET`
- **Controller:** `FuncionalidadeController::index`
- **Linha:** 1635

---

### /funcionalidade/sistema

- **Método:** `GET`
- **Controller:** `FuncionalidadeController::listarApenasFuncionalidades`
- **Linha:** 1636

---

### /funcionalidade/{id}

- **Método:** `GET`
- **Controller:** `FuncionalidadeController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1638

---

### /grupo/{id}/funcionalidades

- **Método:** `GET`
- **Controller:** `FuncionalidadeController::listaFuncionalidadesGrupo`
- **Parâmetros:**
  - `$id`
- **Linha:** 1643

---

### /funcionalidade/{id}/grupos

- **Método:** `GET`
- **Controller:** `FuncionalidadeController::listaGruposFuncionalidade`
- **Parâmetros:**
  - `$id`
- **Linha:** 1645

---

### /menu/usuario/{id}

- **Método:** `GET`
- **Controller:** `FuncionalidadeController::montaMenu`
- **Parâmetros:**
  - `$id`
- **Linha:** 1649

---

### /logado/funcionalidades

- **Método:** `GET`
- **Controller:** `AuthController::usuLogadoFunc`
- **Linha:** 1655

---

### /seguimento/{id}

- **Método:** `GET`
- **Controller:** `SeguimentoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1661

---

### /seguimento/{id}/clientes

- **Método:** `GET`
- **Controller:** `SeguimentoController::clientes`
- **Parâmetros:**
  - `$id`
- **Linha:** 1664

---

### /produto

- **Método:** `GET`
- **Controller:** `ProdutoController::index`
- **Linha:** 1668

---

### /produto/{id}

- **Método:** `GET`
- **Controller:** `ProdutoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1669

---

### /produto/relatorio/vinculados

- **Método:** `GET`
- **Controller:** `ProdutoController::relatorioProdutosVinculados`
- **Linha:** 1670

---

### /listar/fornecedor

- **Método:** `GET`
- **Controller:** `FornecedorController::index`
- **Linha:** 1674

---

### /cliente

- **Método:** `GET`
- **Controller:** `ClienteController::index`
- **Linha:** 1675

---

### /cliente/{id}

- **Método:** `GET`
- **Controller:** `ClienteController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1677

---

### /omie-cliente/listar-origens

- **Método:** `GET`
- **Controller:** `OmieIntegracaoClienteController::listarOrigens`
- **Linha:** 1684

---

### /omie-cliente/listar-verticais

- **Método:** `GET`
- **Controller:** `OmieIntegracaoClienteController::listarVerticais`
- **Linha:** 1685

---

### /producao

- **Método:** `GET`
- **Controller:** `ProducaoController::index`
- **Linha:** 1689

---

### /producao/{id}

- **Método:** `GET`
- **Controller:** `ProducaoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1690

---

### /producao-by-num

- **Método:** `GET`
- **Controller:** `ProducaoController::getByNum`
- **Linha:** 1691

---

### /producao-aberto

- **Método:** `GET`
- **Controller:** `ProducaoController::OrdemProducaoEmAberto`
- **Linha:** 1692

---

### /producao/{op_cod}/item-pendente/{produto_cod}

- **Método:** `GET`
- **Controller:** `ProducaoController::buscaDadosItemPendente`
- **Parâmetros:**
  - `$op_cod`
  - `$produto_cod`
- **Linha:** 1697

---

### /setor-executante

- **Método:** `GET`
- **Controller:** `SetorExecutanteController::index`
- **Linha:** 1707

---

### /setor-executante/{id}

- **Método:** `GET`
- **Controller:** `SetorExecutanteController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1709

---

### /trabalho

- **Método:** `GET`
- **Controller:** `TrabalhoController::index`
- **Linha:** 1720

---

### /trabalho/{id}

- **Método:** `GET`
- **Controller:** `TrabalhoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1722

---

### /tipoProduto

- **Método:** `GET`
- **Controller:** `TipoProdutoController::index`
- **Linha:** 1728

---

### /tipoProduto/{id}

- **Método:** `GET`
- **Controller:** `TipoProdutoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1730

---

### /injetora/corrente

- **Método:** `GET`
- **Controller:** `InjetoraController::index`
- **Linha:** 1737

---

### /injetora/correnteAtual

- **Método:** `GET`
- **Controller:** `InjetoraController::correnteAtual`
- **Linha:** 1738

---

### /EstadosInjetoras

- **Método:** `GET`
- **Controller:** `EstadosInjetoraController::index`
- **Linha:** 1744

---

### /giga

- **Método:** `GET`
- **Controller:** `GigaController::index`
- **Linha:** 1749

---

### /giga/{id}

- **Método:** `GET`
- **Controller:** `GigaController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1751

---

### /sessao

- **Método:** `GET`
- **Controller:** `SessaoTestesController::index`
- **Linha:** 1757

---

### /sessao/{id}/resultados

- **Método:** `GET`
- **Controller:** `SessaoTestesController::listaResultadosSessao`
- **Parâmetros:**
  - `$id`
- **Linha:** 1763

---

### /sessao/{id}/testes

- **Método:** `GET`
- **Controller:** `SessaoTestesController::listaTestesSessao`
- **Parâmetros:**
  - `$id`
- **Linha:** 1764

---

### /teste/sessao/{id}

- **Método:** `GET`
- **Controller:** `TesteController::listaTestesSessao`
- **Parâmetros:**
  - `$id`
- **Linha:** 1769

---

### /teste/totalizadores-simples/op/{op_cod}

- **Método:** `GET`
- **Controller:** `TesteController::listaTotalizadoresSimplesPorOP`
- **Parâmetros:**
  - `$op_cod`
- **Linha:** 1770

---

### /teste/resultados/op/{op_cod}

- **Método:** `GET`
- **Controller:** `TesteController::resultadosDeTestePorOP`
- **Parâmetros:**
  - `$op_cod`
- **Linha:** 1771

---

### /parametroTeste

- **Método:** `GET`
- **Controller:** `ParametroTesteController::index`
- **Linha:** 1775

---

### /parametroTeste/produto/{produto_cod}

- **Método:** `GET`
- **Controller:** `ParametroTesteController::show`
- **Parâmetros:**
  - `$produto_cod`
- **Linha:** 1776

---

### /ciclo

- **Método:** `GET`
- **Controller:** `CicloController::index`
- **Linha:** 1782

---

### /ciclo/{id}

- **Método:** `GET`
- **Controller:** `CicloController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1784

---

### /

- **Método:** `GET`
- **Controller:** `ReuniaoTemaController::index`
- **Linha:** 1791

---

### /{id}

- **Método:** `GET`
- **Controller:** `ReuniaoTemaController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1792

---

### /

- **Método:** `GET`
- **Controller:** `ReuniaoTipoController::index`
- **Linha:** 1800

---

### /{id}

- **Método:** `GET`
- **Controller:** `ReuniaoTipoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1801

---

### /

- **Método:** `GET`
- **Controller:** `ReuniaoStatusController::index`
- **Linha:** 1805

---

### /{id}

- **Método:** `GET`
- **Controller:** `ReuniaoStatusController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1806

---

### /

- **Método:** `GET`
- **Controller:** `ReuniaoController::index`
- **Linha:** 1809

---

### /{id}

- **Método:** `GET`
- **Controller:** `ReuniaoController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 1810

---

## POST Routes

### /iot/localizacao/gravar

- **Método:** `POST`
- **Controller:** `LocalizacaoController::gravarLocalizacao`
- **Linha:** 244

---

### /cartaoPessoa/valida

- **Método:** `POST`
- **Controller:** `AcessoController::testaCartao`
- **Linha:** 247

---

### /acesso

- **Método:** `POST`
- **Controller:** `AcessoController::store`
- **Linha:** 248

---

### /enviar-codigo

- **Método:** `POST`
- **Controller:** `UsuarioChaveController::enviarCodigo`
- **Linha:** 257

---

### /validar-codigo

- **Método:** `POST`
- **Controller:** `UsuarioChaveController::validarCodigo`
- **Linha:** 258

---

### /redefinir-senha

- **Método:** `POST`
- **Controller:** `RedefinirSenhaController::processarRedefinicaoSenha`
- **Linha:** 259

---

### /usuario/senha/alterar

- **Método:** `POST`
- **Controller:** `AuthController::alterarSenha`
- **Linha:** 260

---

### /pedido-venda

- **Método:** `POST`
- **Controller:** `PedidoVendaImportacaoController::importarPedidoVenda`
- **Linha:** 265

---

### /estrutura-produto

- **Método:** `POST`
- **Controller:** `ImportacaoEstruturaProdutoController::importarEstrutura`
- **Linha:** 266

---

### /motivo

- **Método:** `POST`
- **Controller:** `importacaoOmieController::buscaMotivo`
- **Linha:** 286

---

### /oportunidade

- **Método:** `POST`
- **Controller:** `importacaoOmieController::buscaOportunidade`
- **Linha:** 287

---

### /omie-wh/atualiza-pedido-venda

- **Método:** `POST`
- **Controller:** `PropostaComercialController::store`
- **Linha:** 294

---

### /omie-cliente/wh

- **Método:** `POST`
- **Controller:** `OmieIntegracaoClienteController::getFromOmieWh`
- **Linha:** 298

---

### /sgi/roteiro/gravar

- **Método:** `POST`
- **Controller:** `SgiApontamentoController::gravarRoteiro`
- **Linha:** 304

---

### /sgi/roteiro/atualizar

- **Método:** `POST`
- **Controller:** `SgiApontamentoController::updateRoteiro`
- **Linha:** 305

---

### /sgi/relatorio/gerar-excel

- **Método:** `POST`
- **Controller:** `SgiRelatorioGeralController::gerarExcel`
- **Linha:** 306

---

### /sgi/relatorio/compras/download

- **Método:** `POST`
- **Controller:** `RelatorioSgiController::relatorioComprasDownload`
- **Linha:** 307

---

### /sgi/relatorio/compras

- **Método:** `POST`
- **Controller:** `RelatorioSgiController::relatorioCompras`
- **Linha:** 308

---

### /sgi/requisicao/gravar

- **Método:** `POST`
- **Controller:** `SgiRequisicaoController::GravarRequisicao`
- **Linha:** 310

---

### /sgi/requisicao/atualizar

- **Método:** `POST`
- **Controller:** `SgiRequisicaoController::AtualizarRequisicao`
- **Linha:** 311

---

### /sgi/relatorio/geral/download

- **Método:** `POST`
- **Controller:** `SgiRelatorioGeralController::RelatorioGeralDownload`
- **Linha:** 314

---

### /sgi/requisicao/recepcao

- **Método:** `POST`
- **Controller:** `SgiRequisicaoController::EtapaRecepcao`
- **Linha:** 315

---

### /sgi/requisicao/almoxarifado

- **Método:** `POST`
- **Controller:** `SgiRequisicaoController::EtapaAlmoxarifado`
- **Linha:** 316

---

### /sgi/op-apontamento/atualizar

- **Método:** `POST`
- **Controller:** `SgiApontamentoController::AtualizarOPApontamento`
- **Linha:** 317

---

### /sgi/op-apontamento/gravar

- **Método:** `POST`
- **Controller:** `SgiApontamentoController::GravarOPApontamento`
- **Linha:** 318

---

### /sgi/apontamento/gravar

- **Método:** `POST`
- **Controller:** `SgiApontamentoController::GravarApontamentoItem`
- **Linha:** 319

---

### /sgi/apontamento/atualizar

- **Método:** `POST`
- **Controller:** `SgiApontamentoController::AtualizarApontamentoItem`
- **Linha:** 320

---

### /pedidoCompra/buscar

- **Método:** `POST`
- **Controller:** `PedidoCompraController::buscarInformacoes`
- **Linha:** 321

---

### /pedidoCompra/exibir

- **Método:** `POST`
- **Controller:** `PedidoCompraController::exibirInformacoes`
- **Linha:** 322

---

### /sgi/requisicao/alterar-estado

- **Método:** `POST`
- **Controller:** `SgiRequisicaoController::alterarEstadoRequisicao`
- **Linha:** 324

---

### /sgi/requisicao/regredir-etapa

- **Método:** `POST`
- **Controller:** `SgiRequisicaoController::regredirEtapa`
- **Linha:** 325

---

### /sgi/servico/atualizar

- **Método:** `POST`
- **Controller:** `SgiRequisicaoController::AtualizarGestaoServico`
- **Linha:** 328

---

### /email/fornecedor

- **Método:** `POST`
- **Controller:** `EmailFornecedorController::fornecedor`
- **Linha:** 329

---

### /acesso/qrcode

- **Método:** `POST`
- **Controller:** `AcessoController::registrarPorQRCode`
- **Linha:** 341

---

### compras/realizadas

- **Método:** `POST`
- **Controller:** `ProtocoloComprasController::listarComprasRealizadas`
- **Linha:** 351

---

### op/cadastrar

- **Método:** `POST`
- **Controller:** `OrdemProducaoIntegracaoController::store`
- **Linha:** 354

---

### op/excluir

- **Método:** `POST`
- **Controller:** `OrdemProducaoIntegracaoController::destroy`
- **Linha:** 356

---

### estoque/buscar

- **Método:** `POST`
- **Controller:** `ConsultarEstoqueController::ConsultarEstoque`
- **Linha:** 357

---

### produto-estrutura/sync

- **Método:** `POST`
- **Controller:** `OrdemProducaoIntegracaoController::syncEstruturaPorProduto`
- **Linha:** 358

---

### /anexar/{entidade}/{id}

- **Método:** `POST`
- **Controller:** `AnexoController::anexar`
- **Parâmetros:**
  - `$entidade`
  - `$id`
- **Linha:** 365

---

### /reunioes

- **Método:** `POST`
- **Controller:** `ReuniaoRelatorioController::relatorioReunioes`
- **Linha:** 371

---

### /inspecoes

- **Método:** `POST`
- **Controller:** `InspecaoRelatorioController::relatorioInspecoes`
- **Linha:** 372

---

### /pos-vendas

- **Método:** `POST`
- **Controller:** `PosVendaRelatorioController::relatorioPosVendas`
- **Linha:** 373

---

### /criar

- **Método:** `POST`
- **Controller:** `DemDemandaController::criarDemanda`
- **Linha:** 385

---

### itens/listar

- **Método:** `POST`
- **Controller:** `DemDemandaItemController::listarItens`
- **Linha:** 395

---

### /itens/status

- **Método:** `POST`
- **Controller:** `DemDemandaItemController::listarItensPorStatus`
- **Linha:** 396

---

### itens/autorizar

- **Método:** `POST`
- **Controller:** `DemDemandaItemController::autorizarItens`
- **Linha:** 397

---

### /requisicao/criar

- **Método:** `POST`
- **Controller:** `CompRequisicaoController::criarRequisicao`
- **Linha:** 405

---

### /requisicao/{id}/enviar-aprovacao

- **Método:** `POST`
- **Controller:** `CompRequisicaoController::enviarParaAprovacao`
- **Parâmetros:**
  - `$id`
- **Linha:** 410

---

### /requisicao/{id}/voltar-cotacao

- **Método:** `POST`
- **Controller:** `CompRequisicaoController::voltarParaCotacao`
- **Parâmetros:**
  - `$id`
- **Linha:** 411

---

### /cotacao/criar

- **Método:** `POST`
- **Controller:** `CompCotacaoController::criarCotacao`
- **Linha:** 417

---

### /cotacao/salvar

- **Método:** `POST`
- **Controller:** `CompCotacaoController::salvarCotacoes`
- **Linha:** 418

---

### /aprovacao/criar

- **Método:** `POST`
- **Controller:** `CompAprovacaoController::criarAprovacao`
- **Linha:** 425

---

### /aprovacao/requisicao/{id}/finalizar

- **Método:** `POST`
- **Controller:** `CompAprovacaoController::finalizarAprovacaoRequisicao`
- **Parâmetros:**
  - `$id`
- **Linha:** 426

---

### /aprovacao/requisicao/{id}/processar-lote

- **Método:** `POST`
- **Controller:** `CompAprovacaoController::processarAprovacoesEmLote`
- **Parâmetros:**
  - `$id`
- **Linha:** 427

---

### /pedido-compra/finalizar

- **Método:** `POST`
- **Controller:** `CompPedidoCompraController::finalizarPedidoCompra`
- **Linha:** 432

---

### /pedido-compra/salvar

- **Método:** `POST`
- **Controller:** `CompPedidoCompraController::salvarPedidoCompra`
- **Linha:** 433

---

### /pedido-compra/concluir

- **Método:** `POST`
- **Controller:** `CompPedidoCompraController::concluirPedidoCompra`
- **Linha:** 434

---

### /recebimento/salvar

- **Método:** `POST`
- **Controller:** `CompRecebimentoController::salvarRecebimento`
- **Linha:** 437

---

### /recebimento/adicionar

- **Método:** `POST`
- **Controller:** `CompRecebimentoController::adicionarRecebimento`
- **Linha:** 438

---

### /almoxarifado/{id}/finalizar

- **Método:** `POST`
- **Controller:** `CompRequisicaoController::finalizarAlmoxarifado`
- **Parâmetros:**
  - `$id`
- **Linha:** 442

---

### /gestao-servico/{requisicaoId}/salvar

- **Método:** `POST`
- **Controller:** `CompGestaoServicoController::salvarGestaoServico`
- **Parâmetros:**
  - `$requisicaoId`
- **Linha:** 447

---

### /gestao-servico/{requisicaoId}/atualizar-status

- **Método:** `POST`
- **Controller:** `CompGestaoServicoController::atualizarStatusExecucao`
- **Parâmetros:**
  - `$requisicaoId`
- **Linha:** 448

---

### /gestao-servico/{requisicaoId}/encaminhar-pagamento

- **Método:** `POST`
- **Controller:** `CompGestaoServicoController::encaminharParaPagamento`
- **Parâmetros:**
  - `$requisicaoId`
- **Linha:** 449

---

### /gestao-servico/{requisicaoId}/finalizar

- **Método:** `POST`
- **Controller:** `CompGestaoServicoController::finalizarRequisicaoServico`
- **Parâmetros:**
  - `$requisicaoId`
- **Linha:** 450

---

### /pagamento/salvar

- **Método:** `POST`
- **Controller:** `CompPagamentoController::salvarPagamento`
- **Linha:** 455

---

### gravar

- **Método:** `POST`
- **Controller:** `DemMotivacaoController::store`
- **Linha:** 460

---

### /sincronizar-por-tipo

- **Método:** `POST`
- **Controller:** `DemMotivacaoController::syncOrigensPorTipo`
- **Linha:** 465

---

### gravar

- **Método:** `POST`
- **Controller:** `DemOrigemController::store`
- **Linha:** 473

---

### gravar

- **Método:** `POST`
- **Controller:** `DemFamiliaController::store`
- **Linha:** 483

---

### gravar

- **Método:** `POST`
- **Controller:** `DemServicoController::store`
- **Linha:** 492

---

### importar

- **Método:** `POST`
- **Controller:** `DemServicoController::importar`
- **Linha:** 496

---

### /gravar

- **Método:** `POST`
- **Controller:** `PosVendaController::store`
- **Linha:** 502

---

### /gravar

- **Método:** `POST`
- **Controller:** `PosVendaTarefaController::store`
- **Linha:** 517

---

### /inspecao

- **Método:** `POST`
- **Controller:** `InspecaoController::registrarInspecao`
- **Linha:** 521

---

### /inspecao-parametro

- **Método:** `POST`
- **Controller:** `InspecaoController::registrarInspecaoParametro`
- **Linha:** 522

---

### /parametros/sincronizar

- **Método:** `POST`
- **Controller:** `AtivoParametroController::syncParametros`
- **Linha:** 528

---

### /gravar

- **Método:** `POST`
- **Controller:** `GestaoMateriaisParametroController::store`
- **Linha:** 534

---

### /pedido-venda

- **Método:** `POST`
- **Controller:** `PedidoVendaRelatorioController::relatorioEstruturaProdutos`
- **Linha:** 541

---

### /responder/comentario-com-comentario

- **Método:** `POST`
- **Controller:** `ProtocoloComentarioController::responderComentarioComComentario`
- **Linha:** 551

---

### /responder/comentario-com-tarefa

- **Método:** `POST`
- **Controller:** `ProtocoloComentarioController::responderComentarioComTarefa`
- **Linha:** 552

---

### /responder/comentario-com-anexo

- **Método:** `POST`
- **Controller:** `ProtocoloComentarioController::responderComentarioComAnexo`
- **Linha:** 553

---

### /responder/tarefa-com-tarefa

- **Método:** `POST`
- **Controller:** `ProtocoloComentarioController::responderTarefaComTarefa`
- **Linha:** 555

---

### /responder/tarefa-com-comentario

- **Método:** `POST`
- **Controller:** `ProtocoloComentarioController::responderTarefaComComentario`
- **Linha:** 556

---

### /responder/tarefa-com-anexo

- **Método:** `POST`
- **Controller:** `ProtocoloComentarioController::responderTarefaComAnexo`
- **Linha:** 557

---

### /comentario/gravar

- **Método:** `POST`
- **Controller:** `ProtocoloComentarioController::storeComentarioRaiz`
- **Linha:** 559

---

### /tarefas/status

- **Método:** `POST`
- **Controller:** `ProtocoloController::ListarProtocoloEstatisticas`
- **Linha:** 562

---

### /gravar

- **Método:** `POST`
- **Controller:** `ProtocoloController::GravarProtocolo`
- **Linha:** 566

---

### /atualizar/{id}

- **Método:** `POST`
- **Controller:** `ProtocoloController::AtualizarProtocolo`
- **Parâmetros:**
  - `$id`
- **Linha:** 567

---

### /tarefa/gravar

- **Método:** `POST`
- **Controller:** `ProtocoloTarefaController::GravarTarefa`
- **Linha:** 572

---

### /tarefa/excluir/{id}

- **Método:** `POST`
- **Controller:** `ProtocoloTarefaController::ExcluirTarefa`
- **Parâmetros:**
  - `$id`
- **Linha:** 574

---

### /encerrar

- **Método:** `POST`
- **Controller:** `ProtocoloEncerramentoController::store`
- **Linha:** 579

---

### /gravar

- **Método:** `POST`
- **Controller:** `RoteiroController::store`
- **Linha:** 588

---

### /cadastrar

- **Método:** `POST`
- **Controller:** `Rot2RoteiroController::cadastrarRoteiro`
- **Linha:** 599

---

### /etapa

- **Método:** `POST`
- **Controller:** `Rot2EtapaController::store`
- **Linha:** 600

---

### /tipo

- **Método:** `POST`
- **Controller:** `Rot2TipoEtapaController::store`
- **Linha:** 601

---

### /orientacao

- **Método:** `POST`
- **Controller:** `Rot2OrientacaoController::store`
- **Linha:** 602

---

### /instrucao

- **Método:** `POST`
- **Controller:** `Rot2InstrucaoController::store`
- **Linha:** 603

---

### /editarOrdem

- **Método:** `POST`
- **Controller:** `Rot2EtapaController::alterarOrdem`
- **Linha:** 604

---

### /{produto_cod}/iniciar-edicao

- **Método:** `POST`
- **Controller:** `Rot2RoteiroController::iniciarEdicao`
- **Parâmetros:**
  - `$produto_cod`
- **Linha:** 607

---

### /{id}/publicar

- **Método:** `POST`
- **Controller:** `Rot2RoteiroController::publicar`
- **Parâmetros:**
  - `$id`
- **Linha:** 608

---

### /adicionar

- **Método:** `POST`
- **Controller:** `EstruturaRoteiroController::adicionarSetor`
- **Linha:** 614

---

### /adicionar

- **Método:** `POST`
- **Controller:** `SetorServicoController::adicionarServico`
- **Linha:** 621

---

### /gravar

- **Método:** `POST`
- **Controller:** `ParametroController::store`
- **Linha:** 632

---

### /{id}/restaurar

- **Método:** `POST`
- **Controller:** `ParametroController::restore`
- **Parâmetros:**
  - `$id`
- **Linha:** 637

---

### /gravar

- **Método:** `POST`
- **Controller:** `GabaritoController::store`
- **Linha:** 642

---

### /atualizar/{id}

- **Método:** `POST`
- **Controller:** `GabaritoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 645

---

### /download

- **Método:** `POST`
- **Controller:** `OportunidadeRelatorioController::downloadRelatorioOportunidades`
- **Linha:** 651

---

### /dashboard

- **Método:** `POST`
- **Controller:** `IndicadorOportunidadeController::indicadores`
- **Linha:** 652

---

### /gravar

- **Método:** `POST`
- **Controller:** `OportunidadeController::store`
- **Linha:** 654

---

### /atualizar/{id}

- **Método:** `POST`
- **Controller:** `OportunidadeController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 656

---

### /gravar

- **Método:** `POST`
- **Controller:** `OptOportunidadeController::store`
- **Linha:** 673

---

### /relatorio

- **Método:** `POST`
- **Controller:** `OptOportunidadeController::relatorio`
- **Linha:** 679

---

### /gravar

- **Método:** `POST`
- **Controller:** `OptOportunidadeTarefaController::store`
- **Linha:** 685

---

### /criar-ops-e-reservas

- **Método:** `POST`
- **Controller:** `CrmProducaoController::criaOPsEReservas`
- **Linha:** 708

---

### /criar-ops-reservas-compras-para-outra-op

- **Método:** `POST`
- **Controller:** `CrmProducaoController::criaOPsReservasEComprasDerivadasDeOutraOP`
- **Linha:** 709

---

### /inicia-op

- **Método:** `POST`
- **Controller:** `CrmProducaoController::iniciaOP`
- **Linha:** 710

---

### /gravar

- **Método:** `POST`
- **Controller:** `PropostaComercialTarefaController::store`
- **Linha:** 721

---

### /gravar

- **Método:** `POST`
- **Controller:** `ExpedicaoController::store`
- **Linha:** 727

---

### /adicionar

- **Método:** `POST`
- **Controller:** `EstruturaProdutoController::adicionarItem`
- **Linha:** 734

---

### /cliente-temp/gravar

- **Método:** `POST`
- **Controller:** `ClienteTempController::store`
- **Linha:** 747

---

### /usuario/reativar

- **Método:** `POST`
- **Controller:** `UserController::reativarUsuarioPessoa`
- **Linha:** 754

---

### /material-utilizado/gravar

- **Método:** `POST`
- **Controller:** `MaterialUtilizadoController::store`
- **Linha:** 760

---

### /material-utilizado/buscar

- **Método:** `POST`
- **Controller:** `MaterialUtilizadoController::listarMateriaisUtilizados`
- **Linha:** 763

---

### /projeto/programa/{id}

- **Método:** `POST`
- **Controller:** `ProjetoController::ListarProjetoPrograma`
- **Parâmetros:**
  - `$id`
- **Linha:** 766

---

### /verbos/gravar

- **Método:** `POST`
- **Controller:** `VerboController::store`
- **Linha:** 771

---

### /objetos/gravar

- **Método:** `POST`
- **Controller:** `ObjetoController::store`
- **Linha:** 778

---

### /locais/gravar

- **Método:** `POST`
- **Controller:** `LocalCodController::store`
- **Linha:** 785

---

### /codificacoes/gravar

- **Método:** `POST`
- **Controller:** `CodificacaoController::store`
- **Linha:** 792

---

### campos/listar

- **Método:** `POST`
- **Controller:** `FamiliaCamposController::listarPorFamilia`
- **Linha:** 800

---

### campos/v2/listar

- **Método:** `POST`
- **Controller:** `FamiliaCamposController::listarCamposCompletos`
- **Linha:** 801

---

### campos/sincronizar

- **Método:** `POST`
- **Controller:** `FamiliaCamposController::syncCampos`
- **Linha:** 802

---

### campos/valores/listar

- **Método:** `POST`
- **Controller:** `FamiliaCamposController::listarValoresPossiveisPorFamilia`
- **Linha:** 803

---

### campos/buscar/valores

- **Método:** `POST`
- **Controller:** `FamiliaCamposController::listarPorCampoFamilia`
- **Linha:** 804

---

### cadastrar

- **Método:** `POST`
- **Controller:** `CampoProdutoController::cadastrarValores`
- **Linha:** 808

---

### /campos/gravar

- **Método:** `POST`
- **Controller:** `CampoProdutoController::gravarCampo`
- **Linha:** 815

---

### /sem-categorizacao

- **Método:** `POST`
- **Controller:** `SemCategorizacaoProdutoController::store`
- **Linha:** 825

---

### /gravar

- **Método:** `POST`
- **Controller:** `FamiliaProdutoController::store`
- **Linha:** 833

---

### /unidade-medida/gravar

- **Método:** `POST`
- **Controller:** `UnidadeMedidaProdutoController::store`
- **Linha:** 841

---

### /produto-filtrar

- **Método:** `POST`
- **Controller:** `ProdutoController::produtosFiltrados`
- **Linha:** 854

---

### /monitoramento/acelerometro/gravar

- **Método:** `POST`
- **Controller:** `AcelerometroRegistroController::GravarRegistroAcelerometro`
- **Linha:** 863

---

### /monitoramento/acelerometro/buscar/{id}

- **Método:** `POST`
- **Controller:** `AcelerometroRegistroController::BuscarRegistroAcelerometro`
- **Parâmetros:**
  - `$id`
- **Linha:** 864

---

### /dispositivo/relatorio/acelerometro

- **Método:** `POST`
- **Controller:** `AcelerometroRegistroController::GerarRelatorioAcelerometro`
- **Linha:** 865

---

### /monitoramento-bateria

- **Método:** `POST`
- **Controller:** `BateriaRegistroController::store`
- **Linha:** 870

---

### /monitor-bateria/{id}

- **Método:** `POST`
- **Controller:** `BateriaRegistroController::show`
- **Parâmetros:**
  - `$id`
- **Linha:** 871

---

### /relatorio/monitorar-bateria

- **Método:** `POST`
- **Controller:** `BateriaRegistroController::gerarRelatorio`
- **Linha:** 872

---

### /cadastrar/dispositivo-status

- **Método:** `POST`
- **Controller:** `DispositivoController::store`
- **Linha:** 875

---

### /omie/consultar/pedido-venda/{pedido_venda}

- **Método:** `POST`
- **Controller:** `OmiePedidoVendaController::buscarPedidoVendaOmie`
- **Parâmetros:**
  - `$pedido_venda`
- **Linha:** 883

---

### /pcm-producao/{op_cod}/iniciar

- **Método:** `POST`
- **Controller:** `ProducaoControleController::iniciarProducaoPCM`
- **Parâmetros:**
  - `$op_cod`
- **Linha:** 889

---

### /pcm-producao/{op_cod}/cancelar

- **Método:** `POST`
- **Controller:** `ProducaoControleController::cancelarProducaoPCM`
- **Parâmetros:**
  - `$op_cod`
- **Linha:** 890

---

### /pcm-producao/{op_cod}/finalizar

- **Método:** `POST`
- **Controller:** `ProducaoControleController::finalizarProducaoPCM`
- **Parâmetros:**
  - `$op_cod`
- **Linha:** 891

---

### /produto/omie/cadastrar

- **Método:** `POST`
- **Controller:** `ApiOmieController::cadastrarProduto`
- **Linha:** 896

---

### /produto/alterar/{produto_cod}

- **Método:** `POST`
- **Controller:** `ProdutoStagingController::registrarAlteracaoProdutoAntigo`
- **Parâmetros:**
  - `$produto_cod`
- **Linha:** 905

---

### /empresas-contrante/gravar

- **Método:** `POST`
- **Controller:** `EmpresasContratanteController::store`
- **Linha:** 922

---

### /cor-raca/gravar

- **Método:** `POST`
- **Controller:** `CorRacaController::store`
- **Linha:** 928

---

### /escolaridade/gravar

- **Método:** `POST`
- **Controller:** `EscolaridadeController::store`
- **Linha:** 934

---

### /estado-civil/gravar

- **Método:** `POST`
- **Controller:** `EstadoCivilController::store`
- **Linha:** 940

---

### /religiao/gravar

- **Método:** `POST`
- **Controller:** `ReligiaoController::store`
- **Linha:** 946

---

### /tamanho/gravar

- **Método:** `POST`
- **Controller:** `TamanhoController::store`
- **Linha:** 952

---

### /tipo-conta/gravar

- **Método:** `POST`
- **Controller:** `ContaTipoController::store`
- **Linha:** 958

---

### /parentesco/gravar

- **Método:** `POST`
- **Controller:** `ParentescoController::store`
- **Linha:** 964

---

### /tipo-graduacao/gravar

- **Método:** `POST`
- **Controller:** `GraduacaoTipoController::store`
- **Linha:** 970

---

### /regional/gravar

- **Método:** `POST`
- **Controller:** `RegionalController::store`
- **Linha:** 976

---

### /endereco/gravar

- **Método:** `POST`
- **Controller:** `PessoaEnderecoController::gravarEndereco`
- **Linha:** 981

---

### /graduacao/gravar

- **Método:** `POST`
- **Controller:** `PessoaGraduacaoController::gravarGraduacao`
- **Linha:** 985

---

### /contato-emergencia/gravar

- **Método:** `POST`
- **Controller:** `PessoaContatoEmergenciaController::gravarContatoEmergencia`
- **Linha:** 989

---

### /dados-bancarios/gravar

- **Método:** `POST`
- **Controller:** `PessoaDadosBancariosController::gravarDadosBancarios`
- **Linha:** 993

---

### /vinculo-familiar/gravar

- **Método:** `POST`
- **Controller:** `PessoaVinculoController::gravarVinculo`
- **Linha:** 997

---

### /trajeto/gravar

- **Método:** `POST`
- **Controller:** `PessoaTrajetoController::gravarTrajeto`
- **Linha:** 1001

---

### /admissao/gravar

- **Método:** `POST`
- **Controller:** `PessoaAdmissaoController::gravarAdmissao`
- **Linha:** 1005

---

### /motivos

- **Método:** `POST`
- **Controller:** `MotivoDemissaoController::store`
- **Linha:** 1013

---

### /pessoa/usuario/cadastrar

- **Método:** `POST`
- **Controller:** `PessoaController::storePessoaUsuario`
- **Linha:** 1023

---

### /pessoa/relatorio

- **Método:** `POST`
- **Controller:** `PessoaController::relatorioPorPeriodo`
- **Linha:** 1024

---

### /pessoa/setor

- **Método:** `POST`
- **Controller:** `SetorController::SetorPessoa`
- **Linha:** 1027

---

### /pessoa/{id}

- **Método:** `POST`
- **Controller:** `PessoaController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1029

---

### /pessoa

- **Método:** `POST`
- **Controller:** `PessoaController::store`
- **Linha:** 1032

---

### /usuario/setor

- **Método:** `POST`
- **Controller:** `SetorController::SetorUsuario`
- **Linha:** 1033

---

### /movimentacao-material

- **Método:** `POST`
- **Controller:** `MovimentacaoMaterialController::store`
- **Linha:** 1048

---

### /notificacoes/ler

- **Método:** `POST`
- **Controller:** `NotificacaoController::NotificacaoLida`
- **Linha:** 1055

---

### /notificacoes/excluir

- **Método:** `POST`
- **Controller:** `NotificacaoController::NotificacaoExcluida`
- **Linha:** 1056

---

### /projeto/encerrar

- **Método:** `POST`
- **Controller:** `EncerramentoProjetoController::store`
- **Linha:** 1061

---

### /ordem-producao/listar

- **Método:** `POST`
- **Controller:** `ProducaoController::ListarOrdemProducao`
- **Linha:** 1067

---

### /pedido-venda/listar

- **Método:** `POST`
- **Controller:** `OmiePedidoVendaController::ListarPedidoVenda`
- **Linha:** 1068

---

### /op/associar/pedido-venda-item

- **Método:** `POST`
- **Controller:** `OmiePedidoVendaController::AssociarItemPedidoVendaOP`
- **Linha:** 1069

---

### /cargo/gravar

- **Método:** `POST`
- **Controller:** `CargoController::GravarCargo`
- **Linha:** 1077

---

### /associar/pessoa-cargo

- **Método:** `POST`
- **Controller:** `CargoController::AssociarPessoaCargo`
- **Linha:** 1079

---

### /responsavel/usuario

- **Método:** `POST`
- **Controller:** `SetorController::UsuariosPorSetor`
- **Linha:** 1089

---

### /

- **Método:** `POST`
- **Controller:** `SetorController::GravarSetor`
- **Linha:** 1092

---

### /omie/projeto/criar

- **Método:** `POST`
- **Controller:** `ApiOmieController::CriarProjeto`
- **Linha:** 1101

---

### /gravar

- **Método:** `POST`
- **Controller:** `EntregasProjetoController::GravarEntrega`
- **Linha:** 1114

---

### /excluir

- **Método:** `POST`
- **Controller:** `EntregasProjetoController::ExcluirEntrega`
- **Linha:** 1116

---

### /listar

- **Método:** `POST`
- **Controller:** `EntregasProjetoController::ListarEntregasProjeto`
- **Linha:** 1117

---

### /buscar

- **Método:** `POST`
- **Controller:** `EntregasProjetoController::BuscarEntregas`
- **Linha:** 1118

---

### /coordenador/entrega/listar

- **Método:** `POST`
- **Controller:** `EntregasProjetoController::ListarEntregasCoordenador`
- **Linha:** 1121

---

### /tarefa/notificar

- **Método:** `POST`
- **Controller:** `NotificacaoEmailController::NotificacaoTarefa`
- **Linha:** 1125

---

### /forms

- **Método:** `POST`
- **Controller:** `FormController::create`
- **Linha:** 1129

---

### /forms/{formId}/fields

- **Método:** `POST`
- **Controller:** `FormController::addfield`
- **Parâmetros:**
  - `$formId`
- **Linha:** 1130

---

### /forms/{formId}/responses

- **Método:** `POST`
- **Controller:** `FormController::submitResponse`
- **Parâmetros:**
  - `$formId`
- **Linha:** 1131

---

### /categoria/grupo-pessoas/gravar

- **Método:** `POST`
- **Controller:** `CategoriaDREGruposController::GravarGrupoPessoaCategoria`
- **Linha:** 1138

---

### /status-edicao/gravar

- **Método:** `POST`
- **Controller:** `StatusEdicaoController::GravarStatus`
- **Linha:** 1140

---

### /excel/comparar

- **Método:** `POST`
- **Controller:** `OrcamentoDREController::CompararExcelCategoria`
- **Linha:** 1141

---

### /estrutura/listar

- **Método:** `POST`
- **Controller:** `EstruturaDREController::ListarEstruturaDRE`
- **Linha:** 1142

---

### /estrutura/gravar

- **Método:** `POST`
- **Controller:** `EstruturaDREController::AdicionarItemEstrutura`
- **Linha:** 1143

---

### /categoria/gravar

- **Método:** `POST`
- **Controller:** `CategoriaDREController::AdicionarCategoriaDRE`
- **Linha:** 1145

---

### /excel/importar

- **Método:** `POST`
- **Controller:** `OrcamentoDREController::ImportarExcelCategoria`
- **Linha:** 1150

---

### /excel/restaurar

- **Método:** `POST`
- **Controller:** `OrcamentoDREController::RestaurarExcelCategoria`
- **Linha:** 1151

---

### /categoria/orcamento/gravar-atualizar

- **Método:** `POST`
- **Controller:** `CategoriaDREController::GravarAtualizarOrcamentoIndividual`
- **Linha:** 1153

---

### /categoria/associar/categoria-item

- **Método:** `POST`
- **Controller:** `CategoriaDREController::AssociarCategoriaItemCategoriaDRE`
- **Linha:** 1154

---

### /categoria/vincularProdutos

- **Método:** `POST`
- **Controller:** `CategoriaDREController::vincularProdutoCategoria`
- **Linha:** 1156

---

### /categoria/desvincularProdutos

- **Método:** `POST`
- **Controller:** `CategoriaDREController::desvincularProdutoCategoria`
- **Linha:** 1157

---

### /categoria/associar/responsavel

- **Método:** `POST`
- **Controller:** `CategoriaDREGruposController::vincularPessoaSetorCategoria`
- **Linha:** 1160

---

### /projeto/orcamento/gravar-atualizar

- **Método:** `POST`
- **Controller:** `FinanceiroOrcamentoProjetoController::GravarAtualizarOrcamentoProjeto`
- **Linha:** 1168

---

### exercicio-financeiro/gravar

- **Método:** `POST`
- **Controller:** `ExercicioFinanceiroController::store`
- **Linha:** 1170

---

### /orcamento/projeto/mensal

- **Método:** `POST`
- **Controller:** `OrcamentoProjetoController::GastoMensalProjeto`
- **Linha:** 1174

---

### injecao/maquina/gravar

- **Método:** `POST`
- **Controller:** `MaquinaController::GravarMaquina`
- **Linha:** 1185

---

### injecao/op/encerrar

- **Método:** `POST`
- **Controller:** `OpInjecaoController::EncerrarOP`
- **Linha:** 1189

---

### injecao/op/reabrir

- **Método:** `POST`
- **Controller:** `OpInjecaoController::ReabrirOP`
- **Linha:** 1190

---

### trabalho/gravar

- **Método:** `POST`
- **Controller:** `InjetoraTrabalhoController::GravarTrabalho`
- **Linha:** 1195

---

### trabalho/correcao/{id}

- **Método:** `POST`
- **Controller:** `InjetoraTrabalhoController::CorrecaoTrabalho`
- **Parâmetros:**
  - `$id`
- **Linha:** 1197

---

### trabalho/pausar/{id}

- **Método:** `POST`
- **Controller:** `InjetoraTrabalhoController::PausarTrabalho`
- **Parâmetros:**
  - `$id`
- **Linha:** 1198

---

### injecao/motivo/gravar

- **Método:** `POST`
- **Controller:** `InjetoraMotivoController::GravarMotivo`
- **Linha:** 1202

---

### injecao/servico

- **Método:** `POST`
- **Controller:** `InjetoraServicoController::store`
- **Linha:** 1209

---

### injecao/tempo-medio

- **Método:** `POST`
- **Controller:** `InjetoraTrabalhoController::tempoMedio`
- **Linha:** 1211

---

### injecao/qtd-periodo

- **Método:** `POST`
- **Controller:** `InjetoraTrabalhoController::qtdTotalProducaoPeriodo`
- **Linha:** 1212

---

### /programa/cadastrar

- **Método:** `POST`
- **Controller:** `ProgramaController::CriarPrograma`
- **Linha:** 1216

---

### /programa/associar/{id}

- **Método:** `POST`
- **Controller:** `ProgramaController::AssociarPrograma`
- **Parâmetros:**
  - `$id`
- **Linha:** 1220

---

### /programa/associar/excluir/{id}

- **Método:** `POST`
- **Controller:** `ProgramaController::ExcluirAssociarPrograma`
- **Parâmetros:**
  - `$id`
- **Linha:** 1221

---

### /planoAcao/tarefas/status

- **Método:** `POST`
- **Controller:** `PlanoAcaoController::ListarPlanoAcaoEstatisticas`
- **Linha:** 1225

---

### /planoAcao/cadastrar

- **Método:** `POST`
- **Controller:** `PlanoAcaoController::CadastrarPlanoAcao`
- **Linha:** 1226

---

### /gestao/tarefasUsuario

- **Método:** `POST`
- **Controller:** `GestaoProjetoController::ListaTarefasUsuarios`
- **Linha:** 1231

---

### /planoAcaoTarefa/tarefasTime

- **Método:** `POST`
- **Controller:** `PlanoAcaoTarefaController::ListaTarefasTime`
- **Linha:** 1232

---

### /planoAcaoTarefa/cadastrar

- **Método:** `POST`
- **Controller:** `PlanoAcaoTarefaController::CadastrarPlanoAcaoTarefa`
- **Linha:** 1233

---

### /planoAcaoTarefa/anexo/adicionar

- **Método:** `POST`
- **Controller:** `PlanoAcaoTarefaController::AnexoPlanoAcaoTarefaAdicionar`
- **Linha:** 1237

---

### /pcm/cadastrar

- **Método:** `POST`
- **Controller:** `PcmController::CadastrarPcm`
- **Linha:** 1241

---

### /pedidos-edicao/aprovar/{id}

- **Método:** `POST`
- **Controller:** `PcmPedidoEdicaoController::aprovarPedido`
- **Parâmetros:**
  - `$id`
- **Linha:** 1247

---

### /pedidos-edicao

- **Método:** `POST`
- **Controller:** `PcmPedidoEdicaoController::store`
- **Linha:** 1248

---

### /permissao/planoAcao/{id}

- **Método:** `POST`
- **Controller:** `PermissaoController::PermissaoPlanoAcao`
- **Parâmetros:**
  - `$id`
- **Linha:** 1257

---

### /permissao/projeto/{id}

- **Método:** `POST`
- **Controller:** `PermissaoController::PermissaoProjeto`
- **Parâmetros:**
  - `$id`
- **Linha:** 1261

---

### /filtro/sprint

- **Método:** `POST`
- **Controller:** `GestaoProjetoController::ListarSprint`
- **Linha:** 1266

---

### /projeto/filtrar

- **Método:** `POST`
- **Controller:** `GestaoProjetoController::FiltrarProjeto`
- **Linha:** 1268

---

### /projeto/anexo/adicionar

- **Método:** `POST`
- **Controller:** `ProjetoController::AnexoProjetoAdicionar`
- **Linha:** 1270

---

### /sprintTarefa/anexo/adicionar

- **Método:** `POST`
- **Controller:** `SprintTarefaController::AnexoSprintTarefaAdicionar`
- **Linha:** 1273

---

### /projeto/cadastrar

- **Método:** `POST`
- **Controller:** `ProjetoController::CadastrarProjeto`
- **Linha:** 1276

---

### /projeto/tarefas/status

- **Método:** `POST`
- **Controller:** `ProjetoController::ListarProjetoEstatisticas`
- **Linha:** 1282

---

### /projeto/tarefas/status

- **Método:** `POST`
- **Controller:** `ProjetoController::ListarProjetoEstatisticas`
- **Linha:** 1283

---

### /projeto/logs/tarefa/{idTarefa}

- **Método:** `POST`
- **Controller:** `LogTarefaController::ListarLogTarefa`
- **Parâmetros:**
  - `$idTarefa`
- **Linha:** 1284

---

### /projetos/demandas

- **Método:** `POST`
- **Controller:** `DemandasTemporariasController::store`
- **Linha:** 1285

---

### /projetos/demandas/setor

- **Método:** `POST`
- **Controller:** `DemandasTemporariasController::getDemandasSetor`
- **Linha:** 1286

---

### /sprint/cadastrar

- **Método:** `POST`
- **Controller:** `SprintController::CadastrarSprint`
- **Linha:** 1295

---

### /sprintTarefa/cadastrar

- **Método:** `POST`
- **Controller:** `SprintTarefaController::CadastrarSprintTarefa`
- **Linha:** 1300

---

### /sprintTarefa/kanban/atualizar

- **Método:** `POST`
- **Controller:** `SprintTarefaController::AtualizarKanban`
- **Linha:** 1303

---

### registrar/conferencia

- **Método:** `POST`
- **Controller:** `InventarioController::RegistrarConferenciaAtivo`
- **Linha:** 1307

---

### inventario/gravar

- **Método:** `POST`
- **Controller:** `InventarioController::GravarInventario`
- **Linha:** 1315

---

### ativos/relatorio

- **Método:** `POST`
- **Controller:** `GestaoMateriaisRelatorioController::RelatorioAtivos`
- **Linha:** 1321

---

### solicitacao/relatorio

- **Método:** `POST`
- **Controller:** `GestaoMateriaisRelatorioController::RelatorioSolicitacoes`
- **Linha:** 1322

---

### ativo/notificacao/listar

- **Método:** `POST`
- **Controller:** `AtivosNotificacaoController::ListarNotificacaoAtivo`
- **Linha:** 1324

---

### ativo/notificacao/gravar

- **Método:** `POST`
- **Controller:** `AtivosNotificacaoController::GravarNotificacaoAtivo`
- **Linha:** 1326

---

### ativo/movimentar

- **Método:** `POST`
- **Controller:** `AtivosController::MovimentarAtivo`
- **Linha:** 1330

---

### ativo/historico

- **Método:** `POST`
- **Controller:** `AtivosController::HistoricoAtivo`
- **Linha:** 1331

---

### ativo/pdf/qrcode

- **Método:** `POST`
- **Controller:** `AtivosController::gerarQrcodePDF`
- **Linha:** 1332

---

### ativos/relatorio-completo

- **Método:** `POST`
- **Controller:** `AtivoRelatorioController::relatorioAtivo`
- **Linha:** 1333

---

### ativos/buscar

- **Método:** `POST`
- **Controller:** `AtivosController::BuscarAtivos`
- **Linha:** 1339

---

### ativos/gravar

- **Método:** `POST`
- **Controller:** `AtivosController::GravarAtivos`
- **Linha:** 1341

---

### ativos/atualizar

- **Método:** `POST`
- **Controller:** `AtivosController::AtualizarAtivos`
- **Linha:** 1342

---

### ativos/anexo/adicionar

- **Método:** `POST`
- **Controller:** `AtivosController::AnexoAtivoAdicionar`
- **Linha:** 1345

---

### ativos/anexo/excluir

- **Método:** `POST`
- **Controller:** `AtivosController::AnexoAtivoExcluir`
- **Linha:** 1346

---

### ativos/buscar-por-categorias

- **Método:** `POST`
- **Controller:** `AtivosController::BuscarAtivosPorCategorias`
- **Linha:** 1348

---

### solicitacao-material/gravar

- **Método:** `POST`
- **Controller:** `SolicitacaoController::GravarSolicitacao`
- **Linha:** 1350

---

### solicitacao-material/listar

- **Método:** `POST`
- **Controller:** `SolicitacaoController::ListarSolicitacoes`
- **Linha:** 1351

---

### solicitacao-material/buscar

- **Método:** `POST`
- **Controller:** `SolicitacaoController::BuscarSolicitacao`
- **Linha:** 1352

---

### solicitacao-material-status/atualizar

- **Método:** `POST`
- **Controller:** `SolicitacaoController::AtualizarStatusMaterial`
- **Linha:** 1353

---

### categoria/gravar

- **Método:** `POST`
- **Controller:** `CategoriaController::GravarCategoria`
- **Linha:** 1359

---

### local-fisico/gravar

- **Método:** `POST`
- **Controller:** `LocalFisicoController::GravarLocalFisico`
- **Linha:** 1365

---

### motivo-alerta/gravar

- **Método:** `POST`
- **Controller:** `MotivoAlertaController::GravarMotivoAlerta`
- **Linha:** 1370

---

### status-ativo/gravar

- **Método:** `POST`
- **Controller:** `StatusAtivoController::GravarStatusAtivo`
- **Linha:** 1375

---

### /apontamento-montagem/gravar

- **Método:** `POST`
- **Controller:** `TrabalhoController::store`
- **Linha:** 1379

---

### /apontamento-montagem/pausa-resume/{id}

- **Método:** `POST`
- **Controller:** `TrabalhoController::PausaOuResumeTrabalho`
- **Parâmetros:**
  - `$id`
- **Linha:** 1380

---

### /apontamento-montagem/finaliza/{id}

- **Método:** `POST`
- **Controller:** `TrabalhoController::FinalizaTrabalho`
- **Parâmetros:**
  - `$id`
- **Linha:** 1381

---

### /apontamento-montagem/servicos-realizados

- **Método:** `POST`
- **Controller:** `TrabalhoController::InformaServicosRealizados`
- **Linha:** 1382

---

### /indicador

- **Método:** `POST`
- **Controller:** `IndicadorController::store`
- **Linha:** 1391

---

### /indicador/contas/pagar-receber/ano

- **Método:** `POST`
- **Controller:** `IndicadorController::ContasPagarReceberAno`
- **Linha:** 1398

---

### /indicador/contas/semana-detalhe

- **Método:** `POST`
- **Controller:** `IndicadorController::DetalhesContasPagarReceber`
- **Linha:** 1399

---

### /indicador/contas/pagar-receber

- **Método:** `POST`
- **Controller:** `IndicadorController::ContasPagarReceber`
- **Linha:** 1400

---

### /indicador/conta-receber

- **Método:** `POST`
- **Controller:** `IndicadorController::ContasReceberAnoMes`
- **Linha:** 1401

---

### /indicador/conta-pagar

- **Método:** `POST`
- **Controller:** `IndicadorController::ContasPagarAnoMes`
- **Linha:** 1402

---

### /indicador/projeto/custo

- **Método:** `POST`
- **Controller:** `IndicadorController::CustoProjeto`
- **Linha:** 1403

---

### /indicador/produto-produzido

- **Método:** `POST`
- **Controller:** `IndicadorController::ProdutosProduzidos`
- **Linha:** 1404

---

### /indicador/produto-vendido

- **Método:** `POST`
- **Controller:** `IndicadorController::ProdutosVendidos`
- **Linha:** 1405

---

### /indicador/produto-vendido-mes

- **Método:** `POST`
- **Controller:** `IndicadorController::ProdutosVendidosMes`
- **Linha:** 1406

---

### /omie/oportunidade/mes

- **Método:** `POST`
- **Controller:** `OmieOportunidadeController::mesComOportunidade`
- **Linha:** 1408

---

### /omie/oportunidade/ticket

- **Método:** `POST`
- **Controller:** `OmieOportunidadeController::ticket`
- **Linha:** 1409

---

### /omie/oportunidade/ticket-mes

- **Método:** `POST`
- **Controller:** `OmieOportunidadeController::ticketMes`
- **Linha:** 1410

---

### /omie/oportunidade/proposta-viabilizada

- **Método:** `POST`
- **Controller:** `OmieOportunidadeController::propostaViabilizada`
- **Linha:** 1411

---

### /omie/oportunidade/proposta-viabilizada-maior

- **Método:** `POST`
- **Controller:** `OmieOportunidadeController::propostaViabilizadaMaior`
- **Linha:** 1412

---

### /omie/oportunidade/proposta-viabilizada/detalhe

- **Método:** `POST`
- **Controller:** `OmieOportunidadeController::propostaViabilizadaLista`
- **Linha:** 1413

---

### /omie/oportunidade/proposta-viabilizada-mes

- **Método:** `POST`
- **Controller:** `OmieOportunidadeController::propostaViabilizadaMes`
- **Linha:** 1414

---

### /omie/oportunidade/cliente-alcancado

- **Método:** `POST`
- **Controller:** `OmieOportunidadeController::clienteAlcancado`
- **Linha:** 1415

---

### /omie/oportunidade/cliente-alcancado-semana

- **Método:** `POST`
- **Controller:** `OmieOportunidadeController::clienteAlcancadoSemana`
- **Linha:** 1416

---

### /menu/salvar

- **Método:** `POST`
- **Controller:** `FuncionalidadeController::salvarRelacao`
- **Linha:** 1423

---

### /os/manutencao/indicador

- **Método:** `POST`
- **Controller:** `OrdemServicoIndicadorController::Manutencao`
- **Linha:** 1428

---

### /os/assisTec/indicador

- **Método:** `POST`
- **Controller:** `OrdemServicoIndicadorController::AssistenciaTecnica`
- **Linha:** 1429

---

### /os/retrabalho/indicador

- **Método:** `POST`
- **Controller:** `OrdemServicoIndicadorController::Retrabalho`
- **Linha:** 1430

---

### /os/usinagemCNC/indicador

- **Método:** `POST`
- **Controller:** `OrdemServicoIndicadorController::UsinagemCNC`
- **Linha:** 1431

---

### /os/filtrar/{tipo}

- **Método:** `POST`
- **Controller:** `OrdemServicoFiltroController::OrdemServicoFiltrar`
- **Parâmetros:**
  - `$tipo`
- **Linha:** 1433

---

### /os/relatorio/filtrar

- **Método:** `POST`
- **Controller:** `OrdemServicoFiltroController::OrdemServicoFiltrarRelatorio`
- **Linha:** 1434

---

### /dashboard/os/indicador

- **Método:** `POST`
- **Controller:** `OrdemServicoDashboardController::DashboardIndicador`
- **Linha:** 1437

---

### /dashboard/os/mes

- **Método:** `POST`
- **Controller:** `OrdemServicoDashboardController::DashboardOrdemMes`
- **Linha:** 1438

---

### /os/motivo/gravar

- **Método:** `POST`
- **Controller:** `OrdemServicoMotivoController::GravarMotivo`
- **Linha:** 1441

---

### /os/vincular/responsavel

- **Método:** `POST`
- **Controller:** `OrdemServicoResponsavelController::AssociarResponsavel`
- **Linha:** 1444

---

### /os/atualizar

- **Método:** `POST`
- **Controller:** `OrdemServicoAtualizar::AtualizarOrdemServico`
- **Linha:** 1446

---

### /os/trabalho/gravar

- **Método:** `POST`
- **Controller:** `OrdemServicoTrabalhoController::GravarTrabalho`
- **Linha:** 1448

---

### /os/porta-molde/gravar

- **Método:** `POST`
- **Controller:** `OrdemServicoPortaMoldeController::GravarPortaMolde`
- **Linha:** 1452

---

### /os/objeto-servico/gravar

- **Método:** `POST`
- **Controller:** `OrdemServicoObjetoController::GravarObjetoServico`
- **Linha:** 1456

---

### /os/tipo-servico/gravar

- **Método:** `POST`
- **Controller:** `OrdemServicoTipoController::GravarTipoServico`
- **Linha:** 1460

---

### /os/material-trabalho/gravar

- **Método:** `POST`
- **Controller:** `OrdemServicoMaterialController::gravar`
- **Linha:** 1464

---

### /os/material-trabalho/atualizar

- **Método:** `POST`
- **Controller:** `OrdemServicoMaterialController::AtualizarMaterial`
- **Linha:** 1465

---

### /os/material/receber

- **Método:** `POST`
- **Controller:** `OrdemServicoRecebimentoMaterialController::gravar`
- **Linha:** 1469

---

### marca

- **Método:** `POST`
- **Controller:** `MarcaController::store`
- **Linha:** 1475

---

### modelo

- **Método:** `POST`
- **Controller:** `ModeloController::store`
- **Linha:** 1476

---

### operadora

- **Método:** `POST`
- **Controller:** `OperadoraController::store`
- **Linha:** 1477

---

### /

- **Método:** `POST`
- **Controller:** `OrdemServicoAtivosExternosController::store`
- **Linha:** 1480

---

### /buscar-codigo

- **Método:** `POST`
- **Controller:** `ServicoAtivoExternoController::buscarOsPorMib`
- **Linha:** 1483

---

### servico

- **Método:** `POST`
- **Controller:** `ServicoAtivoExternoController::store`
- **Linha:** 1487

---

### /os/assistencia-tecnica

- **Método:** `POST`
- **Controller:** `AssistenciaTecnicaController::gravar`
- **Linha:** 1494

---

### /os/assistencia-tecnica/{id}/recebe-produto

- **Método:** `POST`
- **Controller:** `AssistenciaTecnicaController::recebeProdutos`
- **Parâmetros:**
  - `$id`
- **Linha:** 1496

---

### /os/manutencao

- **Método:** `POST`
- **Controller:** `ManutencaoController::store`
- **Linha:** 1502

---

### /os/retrabalho

- **Método:** `POST`
- **Controller:** `RetrabalhoController::gravar`
- **Linha:** 1508

---

### /usinagem/gravar

- **Método:** `POST`
- **Controller:** `UsinagemController::GravarUsinagem`
- **Linha:** 1515

---

### /os/{id}/material/lancar

- **Método:** `POST`
- **Controller:** `OrdemServicoMaterialController::store`
- **Parâmetros:**
  - `$id`
- **Linha:** 1523

---

### /os/{id}/servico/lancar

- **Método:** `POST`
- **Controller:** `OrdemServicoController::lancarServicosOs`
- **Parâmetros:**
  - `$id`
- **Linha:** 1529

---

### /os/{id}/relatorio

- **Método:** `POST`
- **Controller:** `OrdemServicoController::insereRelatorioOS`
- **Parâmetros:**
  - `$id`
- **Linha:** 1531

---

### /visita

- **Método:** `POST`
- **Controller:** `VisitaController::visita`
- **Linha:** 1546

---

### /visitante

- **Método:** `POST`
- **Controller:** `PessoaVisitanteController::store`
- **Linha:** 1548

---

### /local

- **Método:** `POST`
- **Controller:** `LocalController::store`
- **Linha:** 1555

---

### /acesso/filtro_data

- **Método:** `POST`
- **Controller:** `AcessoController::indexInterval`
- **Linha:** 1565

---

### /meta

- **Método:** `POST`
- **Controller:** `MetaController::store`
- **Linha:** 1572

---

### /upload/nf

- **Método:** `POST`
- **Controller:** `NotaFiscalController::uploadNF`
- **Linha:** 1579

---

### /register

- **Método:** `POST`
- **Controller:** `AuthController::register`
- **Linha:** 1584

---

### /sistema

- **Método:** `POST`
- **Controller:** `SistemaController::store`
- **Linha:** 1590

---

### /grupo

- **Método:** `POST`
- **Controller:** `GrupoController::store`
- **Linha:** 1599

---

### /usuario/grupo

- **Método:** `POST`
- **Controller:** `GrupoController::usuarioGrupo`
- **Linha:** 1623

---

### /usuarios/grupo

- **Método:** `POST`
- **Controller:** `GrupoController::usuariosGrupo`
- **Linha:** 1624

---

### /funcionalidade/cards/usuario

- **Método:** `POST`
- **Controller:** `FuncionalidadeController::ListarCardsUsuario`
- **Linha:** 1633

---

### /funcionalidade

- **Método:** `POST`
- **Controller:** `FuncionalidadeController::store`
- **Linha:** 1637

---

### /funcionalidade/grupo

- **Método:** `POST`
- **Controller:** `FuncionalidadeController::funcionalidadeGrupo`
- **Linha:** 1641

---

### /funcionalidades/grupo

- **Método:** `POST`
- **Controller:** `FuncionalidadeController::funcionalidadeGrupoArray`
- **Linha:** 1642

---

### /menu/usuario/

- **Método:** `POST`
- **Controller:** `FuncionalidadeController::montaMenuEmail`
- **Linha:** 1650

---

### /logado/grupo/{id}

- **Método:** `POST`
- **Controller:** `GrupoController::usuarioLogadoGrupo`
- **Parâmetros:**
  - `$id`
- **Linha:** 1654

---

### /seguimento

- **Método:** `POST`
- **Controller:** `SeguimentoController::store`
- **Linha:** 1660

---

### /cliente

- **Método:** `POST`
- **Controller:** `ClienteController::store`
- **Linha:** 1676

---

### /omie-cliente/gravar

- **Método:** `POST`
- **Controller:** `OmieIntegracaoClienteController::store`
- **Linha:** 1683

---

### /producao/{op_cod}/estrutura-produto

- **Método:** `POST`
- **Controller:** `ProducaoController::insereEstruturaProdutoOP`
- **Parâmetros:**
  - `$op_cod`
- **Linha:** 1693

---

### /producao/{op_cod}/item-pendente/{produto_cod}

- **Método:** `POST`
- **Controller:** `ProducaoController::adicionaItemPendente`
- **Parâmetros:**
  - `$op_cod`
  - `$produto_cod`
- **Linha:** 1696

---

### /producao/apontamento

- **Método:** `POST`
- **Controller:** `ProducaoApontamentoController::store`
- **Linha:** 1701

---

### /producao/apontamento/op/status

- **Método:** `POST`
- **Controller:** `ProducaoApontamentoController::opStatus`
- **Linha:** 1702

---

### /producao/apontamento/op/ativas

- **Método:** `POST`
- **Controller:** `ProducaoApontamentoController::listarOpsAtivas`
- **Linha:** 1703

---

### /setor-executante

- **Método:** `POST`
- **Controller:** `SetorExecutanteController::store`
- **Linha:** 1708

---

### /pessoa/enviar-qrcode/{id}

- **Método:** `POST`
- **Controller:** `PessoaController::enviarQrcodePessoa`
- **Parâmetros:**
  - `$id`
- **Linha:** 1715

---

### /pessoa-visitante/enviar-qrcode/{id}

- **Método:** `POST`
- **Controller:** `PessoaController::enviarQrcodeVisitante`
- **Parâmetros:**
  - `$id`
- **Linha:** 1716

---

### /trabalho

- **Método:** `POST`
- **Controller:** `TrabalhoController::store`
- **Linha:** 1721

---

### /tipoProduto

- **Método:** `POST`
- **Controller:** `TipoProdutoController::store`
- **Linha:** 1729

---

### /injetora/corrente

- **Método:** `POST`
- **Controller:** `InjetoraController::store`
- **Linha:** 1736

---

### /injetora/sinteseAcoesInjetora/

- **Método:** `POST`
- **Controller:** `InjetoraController::sinteseAcoesInjetora`
- **Linha:** 1739

---

### /EstadosInjetoras

- **Método:** `POST`
- **Controller:** `EstadosInjetoraController::store`
- **Linha:** 1743

---

### /EstadosInjetoras/dia

- **Método:** `POST`
- **Controller:** `EstadosInjetoraController::estadosInjetoraDia`
- **Linha:** 1745

---

### /giga

- **Método:** `POST`
- **Controller:** `GigaController::store`
- **Linha:** 1750

---

### /sessao

- **Método:** `POST`
- **Controller:** `SessaoTestesController::store`
- **Linha:** 1758

---

### /sessao/giga

- **Método:** `POST`
- **Controller:** `SessaoTestesController::listaGigasOp`
- **Linha:** 1760

---

### /sessao/abertas

- **Método:** `POST`
- **Controller:** `SessaoTestesController::listaSessoesAbertasOp`
- **Linha:** 1762

---

### /teste/gravar

- **Método:** `POST`
- **Controller:** `TesteController::store`
- **Linha:** 1768

---

### /parametroTeste

- **Método:** `POST`
- **Controller:** `ParametroTesteController::store`
- **Linha:** 1778

---

### /ciclo

- **Método:** `POST`
- **Controller:** `CicloController::store`
- **Linha:** 1783

---

### /

- **Método:** `POST`
- **Controller:** `ReuniaoTemaController::store`
- **Linha:** 1793

---

### /pautasAnexos

- **Método:** `POST`
- **Controller:** `ReuniaoTemaController::buscaPautasEAnexosPorSetorETipo`
- **Linha:** 1796

---

### /{id}/participante

- **Método:** `POST`
- **Controller:** `ReuniaoController::adicionaParticipante`
- **Parâmetros:**
  - `$id`
- **Linha:** 1811

---

### /

- **Método:** `POST`
- **Controller:** `ReuniaoController::store`
- **Linha:** 1812

---

## PUT Routes

### /item/{itemId}

- **Método:** `PUT`
- **Controller:** `DemDemandaItemController::atualizarItem`
- **Parâmetros:**
  - `$itemId`
- **Linha:** 398

---

### /requisicao/{id}/editar

- **Método:** `PUT`
- **Controller:** `CompEdicaoRequisicaoController::editarRequisicao`
- **Parâmetros:**
  - `$id`
- **Linha:** 414

---

### /cotacao/{id}

- **Método:** `PUT`
- **Controller:** `CompCotacaoController::atualizarCotacao`
- **Parâmetros:**
  - `$id`
- **Linha:** 421

---

### /tarefa/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `ProtocoloTarefaController::AtualizarTarefa`
- **Parâmetros:**
  - `$id`
- **Linha:** 573

---

### /encerrar/{id}

- **Método:** `PUT`
- **Controller:** `ProtocoloEncerramentoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 580

---

### /atualizar/{id}

- **Método:** `PUT`
- **Controller:** `RoteiroController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 591

---

### /etapa/{id}

- **Método:** `PUT`
- **Controller:** `Rot2EtapaController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 600

---

### /tipo/{id}

- **Método:** `PUT`
- **Controller:** `Rot2TipoEtapaController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 601

---

### /orientacao/{id}

- **Método:** `PUT`
- **Controller:** `Rot2OrientacaoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 602

---

### /instrucao/{id}

- **Método:** `PUT`
- **Controller:** `Rot2InstrucaoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 603

---

### {id}/ordem

- **Método:** `PUT`
- **Controller:** `SetorServicoController::atualizarOrdemIndividual`
- **Parâmetros:**
  - `$id`
- **Linha:** 620

---

### /atualizar/{id}

- **Método:** `PUT`
- **Controller:** `ParametroController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 635

---

### /verbos/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `VerboController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 773

---

### /objetos/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `ObjetoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 780

---

### /locais/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `LocalCodController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 787

---

### /codificacoes/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `CodificacaoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 794

---

### atualizar/{id}

- **Método:** `PUT`
- **Controller:** `CampoProdutoController::atualizarValor`
- **Parâmetros:**
  - `$id`
- **Linha:** 810

---

### /atualizar/{id}

- **Método:** `PUT`
- **Controller:** `FamiliaProdutoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 835

---

### /unidade-medida/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `UnidadeMedidaProdutoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 844

---

### /dispositivo/{id}

- **Método:** `PUT`
- **Controller:** `DispositivoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 879

---

### /empresas-contrante/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `EmpresasContratanteController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 925

---

### /cor-raca/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `CorRacaController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 931

---

### /escolaridade/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `EscolaridadeController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 937

---

### /estado-civil/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `EstadoCivilController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 943

---

### /religiao/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `ReligiaoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 949

---

### /tamanho/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `TamanhoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 955

---

### /tipo-conta/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `ContaTipoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 961

---

### /parentesco/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `ParentescoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 967

---

### /tipo-graduacao/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `GraduacaoTipoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 973

---

### /regional/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `RegionalController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 979

---

### /endereco/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `PessoaEnderecoController::atualizarEndereco`
- **Parâmetros:**
  - `$id`
- **Linha:** 982

---

### /graduacao/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `PessoaGraduacaoController::atualizarGraduacao`
- **Parâmetros:**
  - `$id`
- **Linha:** 986

---

### /contato-emergencia/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `PessoaContatoEmergenciaController::atualizarContatoEmergencia`
- **Parâmetros:**
  - `$id`
- **Linha:** 990

---

### /dados-bancarios/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `PessoaDadosBancariosController::atualizarDadosBancarios`
- **Parâmetros:**
  - `$id`
- **Linha:** 994

---

### /vinculo-familiar/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `PessoaVinculoController::atualizarVinculo`
- **Parâmetros:**
  - `$id`
- **Linha:** 998

---

### /trajeto/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `PessoaTrajetoController::atualizarTrajeto`
- **Parâmetros:**
  - `$id`
- **Linha:** 1002

---

### /admissao/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `PessoaAdmissaoController::atualizarAdmissao`
- **Parâmetros:**
  - `$id`
- **Linha:** 1006

---

### /motivos/{id}

- **Método:** `PUT`
- **Controller:** `MotivoDemissaoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1014

---

### /projeto/encerrar/{id}

- **Método:** `PUT`
- **Controller:** `EncerramentoProjetoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1062

---

### /cargo/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `CargoController::AtualizarCargo`
- **Parâmetros:**
  - `$id`
- **Linha:** 1076

---

### /{id}

- **Método:** `PUT`
- **Controller:** `SetorController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1094

---

### /atualizar

- **Método:** `PUT`
- **Controller:** `EntregasProjetoController::AtualizarEntrega`
- **Linha:** 1115

---

### injecao/maquina/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `MaquinaController::AtualizarMaquina`
- **Parâmetros:**
  - `$id`
- **Linha:** 1186

---

### trabalho/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `InjetoraTrabalhoController::AtualizarTrabalho`
- **Parâmetros:**
  - `$id`
- **Linha:** 1196

---

### injecao/motivo/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `InjetoraMotivoController::AtualizarMotivo`
- **Parâmetros:**
  - `$id`
- **Linha:** 1203

---

### /programa/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `ProgramaController::AtualizarPrograma`
- **Parâmetros:**
  - `$id`
- **Linha:** 1218

---

### /programa/excluir/{id}

- **Método:** `PUT`
- **Controller:** `ProgramaController::ExcluirPrograma`
- **Parâmetros:**
  - `$id`
- **Linha:** 1219

---

### /planoAcao/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `PlanoAcaoController::AtualizarPlanoAcao`
- **Parâmetros:**
  - `$id`
- **Linha:** 1228

---

### /planoAcao/excluir/{id}

- **Método:** `PUT`
- **Controller:** `PlanoAcaoController::ExcluirPlanoAcao`
- **Parâmetros:**
  - `$id`
- **Linha:** 1229

---

### /planoAcaoTarefa/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `PlanoAcaoTarefaController::AtualizarPlanoAcaoTarefa`
- **Parâmetros:**
  - `$id`
- **Linha:** 1234

---

### /planoAcaoTarefa/excluir/{id}

- **Método:** `PUT`
- **Controller:** `PlanoAcaoTarefaController::ExcluirPlanoAcaoTarefa`
- **Parâmetros:**
  - `$id`
- **Linha:** 1235

---

### /pcm/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `PcmController::AtualizarPcm`
- **Parâmetros:**
  - `$id`
- **Linha:** 1244

---

### /pcm/excluir/{id}

- **Método:** `PUT`
- **Controller:** `PcmController::ExcluirPcm`
- **Parâmetros:**
  - `$id`
- **Linha:** 1245

---

### /pedidos-edicao/{id}

- **Método:** `PUT`
- **Controller:** `PcmPedidoEdicaoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1248

---

### /projetos/demandas/{id}

- **Método:** `PUT`
- **Controller:** `DemandasTemporariasController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1285

---

### /projeto/excluir/{id}

- **Método:** `PUT`
- **Controller:** `ProjetoController::ExcluirProjeto`
- **Parâmetros:**
  - `$id`
- **Linha:** 1289

---

### /projeto/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `ProjetoController::AtualizarProjeto`
- **Parâmetros:**
  - `$id`
- **Middlewares:** `NotificacaoMiddleware`
- **Nome:** `projeto.atualizar`
- **Linha:** 1291

---

### /sprint/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `SprintController::AtualizarSprint`
- **Parâmetros:**
  - `$id`
- **Linha:** 1297

---

### /sprint/excluir/{id}

- **Método:** `PUT`
- **Controller:** `SprintController::ExcluirSprint`
- **Parâmetros:**
  - `$id`
- **Linha:** 1298

---

### /sprintTarefa/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `SprintTarefaController::AtualizarSprintTarefa`
- **Parâmetros:**
  - `$id`
- **Linha:** 1301

---

### /sprintTarefa/excluir/{id}

- **Método:** `PUT`
- **Controller:** `SprintTarefaController::ExcluirSprintTarefa`
- **Parâmetros:**
  - `$id`
- **Linha:** 1302

---

### inventario/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `InventarioController::AtualizarInventario`
- **Parâmetros:**
  - `$id`
- **Linha:** 1316

---

### ativo/notificacao/atualizar

- **Método:** `PUT`
- **Controller:** `AtivosNotificacaoController::AtualizarNotificacaoAtivo`
- **Linha:** 1327

---

### categoria/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `CategoriaController::AtualizarCategoria`
- **Parâmetros:**
  - `$id`
- **Linha:** 1360

---

### local-fisico/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `LocalFisicoController::AtualizarLocalFisico`
- **Parâmetros:**
  - `$id`
- **Linha:** 1366

---

### motivo-alerta/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `MotivoAlertaController::AtualizarMotivoAlerta`
- **Parâmetros:**
  - `$id`
- **Linha:** 1371

---

### status-ativo/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `StatusAtivoController::AtualizarStatusAtivo`
- **Parâmetros:**
  - `$id`
- **Linha:** 1376

---

### /indicador/{id}

- **Método:** `PUT`
- **Controller:** `IndicadorController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1393

---

### /os/trabalho/atualizar/{id}

- **Método:** `PUT`
- **Controller:** `OrdemServicoTrabalhoController::AtualizarTrabalho`
- **Parâmetros:**
  - `$id`
- **Linha:** 1449

---

### marca/{id}

- **Método:** `PUT`
- **Controller:** `MarcaController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1475

---

### modelo/{id}

- **Método:** `PUT`
- **Controller:** `ModeloController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1476

---

### operadora/{id}

- **Método:** `PUT`
- **Controller:** `OperadoraController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1477

---

### //{id}

- **Método:** `PUT`
- **Controller:** `OrdemServicoAtivosExternosController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1480

---

### servico/{id}

- **Método:** `PUT`
- **Controller:** `ServicoAtivoExternoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1487

---

### /visitante/{id}

- **Método:** `PUT`
- **Controller:** `PessoaVisitanteController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1550

---

### /local/{id}

- **Método:** `PUT`
- **Controller:** `LocalController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1559

---

### /acesso/{id}

- **Método:** `PUT`
- **Controller:** `AcessoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1566

---

### /meta/{id}

- **Método:** `PUT`
- **Controller:** `MetaController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1574

---

### /sistema/{id}

- **Método:** `PUT`
- **Controller:** `SistemaController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1592

---

### /grupo/{id}

- **Método:** `PUT`
- **Controller:** `GrupoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1601

---

### /usuario/{id}

- **Método:** `PUT`
- **Controller:** `AuthController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1630

---

### /funcionalidade/{id}

- **Método:** `PUT`
- **Controller:** `FuncionalidadeController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1639

---

### /seguimento/{id}

- **Método:** `PUT`
- **Controller:** `SeguimentoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1662

---

### /cliente/{id}

- **Método:** `PUT`
- **Controller:** `ClienteController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1678

---

### /setor-executante/{id}

- **Método:** `PUT`
- **Controller:** `SetorExecutanteController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1710

---

### /trabalho/{id}

- **Método:** `PUT`
- **Controller:** `TrabalhoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1723

---

### /tipoProduto/{id}

- **Método:** `PUT`
- **Controller:** `TipoProdutoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1731

---

### /giga/{id}

- **Método:** `PUT`
- **Controller:** `GigaController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1752

---

## PATCH Routes

### op/atualizar

- **Método:** `PATCH`
- **Controller:** `OrdemProducaoIntegracaoController::update`
- **Linha:** 355

---

### produtos/separa-para-op

- **Método:** `PATCH`
- **Controller:** `AlmoxarifadoController::separaParaOP`
- **Linha:** 379

---

### produtos/separa-para-venda

- **Método:** `PATCH`
- **Controller:** `AlmoxarifadoController::separaParaVenda`
- **Linha:** 380

---

### /item/{itemId}/status

- **Método:** `PATCH`
- **Controller:** `DemDemandaItemController::atualizarStatusItem`
- **Parâmetros:**
  - `$itemId`
- **Linha:** 399

---

### atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `DemMotivacaoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 462

---

### atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `DemOrigemController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 475

---

### atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `DemFamiliaController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 485

---

### atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `DemServicoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 494

---

### /atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `PosVendaController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 505

---

### /atualizar

- **Método:** `PATCH`
- **Controller:** `PosVendaDiagnosticoController::update`
- **Linha:** 511

---

### /inspecao-parametro/atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `InspecaoController::atualizarInspecaoParametro`
- **Parâmetros:**
  - `$id`
- **Linha:** 523

---

### /atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `GestaoMateriaisParametroController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 537

---

### /etapa/{id}

- **Método:** `PATCH`
- **Controller:** `Rot2EtapaController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 600

---

### /tipo/{id}

- **Método:** `PATCH`
- **Controller:** `Rot2TipoEtapaController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 601

---

### /orientacao/{id}

- **Método:** `PATCH`
- **Controller:** `Rot2OrientacaoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 602

---

### /instrucao/{id}

- **Método:** `PATCH`
- **Controller:** `Rot2InstrucaoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 603

---

### /ordenar/{id}

- **Método:** `PATCH`
- **Controller:** `EstruturaRoteiroController::atualizarOrdemSetor`
- **Parâmetros:**
  - `$id`
- **Linha:** 615

---

### /atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `SetorServicoController::atualizarServico`
- **Parâmetros:**
  - `$id`
- **Linha:** 622

---

### /material/atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `SetorServicoController::atualizarMaterial`
- **Parâmetros:**
  - `$id`
- **Linha:** 624

---

### /produto-atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `OportunidadeController::atualizarProdutoOportunidade`
- **Parâmetros:**
  - `$id`
- **Linha:** 658

---

### /responsavel-atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `OportunidadeController::atualizarResponsavelOportunidade`
- **Parâmetros:**
  - `$id`
- **Linha:** 659

---

### /finalizacao-atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `OportunidadeController::atualizarFinalizacaoOportunidade`
- **Parâmetros:**
  - `$id`
- **Linha:** 660

---

### /orcamento-atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `OportunidadeController::atualizarOrcamentoOportunidade`
- **Parâmetros:**
  - `$id`
- **Linha:** 661

---

### /atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `OptOportunidadeController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 675

---

### /reativar/{id}

- **Método:** `PATCH`
- **Controller:** `OptOportunidadeController::reativar`
- **Parâmetros:**
  - `$id`
- **Linha:** 676

---

### /suspender

- **Método:** `PATCH`
- **Controller:** `OptOportunidadeController::suspender`
- **Linha:** 677

---

### /atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `PropostaComercialController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 692

---

### /associa-produto/{produtoCod}

- **Método:** `PATCH`
- **Controller:** `PropostaComercialAssocProdutoController::update`
- **Parâmetros:**
  - `$produtoCod`
- **Linha:** 715

---

### /atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `EstruturaProdutoController::atualizarItem`
- **Parâmetros:**
  - `$id`
- **Linha:** 736

---

### /cliente-temp/atualizar{id}

- **Método:** `PATCH`
- **Controller:** `ClienteTempController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 749

---

### /material-utilizado/atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `MaterialUtilizadoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 761

---

### /campos/atualizar/{id}

- **Método:** `PATCH`
- **Controller:** `CampoProdutoController::atualizarCampo`
- **Parâmetros:**
  - `$id`
- **Linha:** 816

---

### /produto/omie/atualizar/{produto_cod}

- **Método:** `PATCH`
- **Controller:** `ApiOmieController::finalizarEdicaoProduto`
- **Parâmetros:**
  - `$produto_cod`
- **Linha:** 899

---

### /produto/editavel/{produto_cod}

- **Método:** `PATCH`
- **Controller:** `ApiOmieController::definirEditavel`
- **Parâmetros:**
  - `$produto_cod`
- **Linha:** 911

---

### /{id}

- **Método:** `PATCH`
- **Controller:** `SetorController::cadPeso`
- **Parâmetros:**
  - `$id`
- **Linha:** 1096

---

### /pedidos-edicao/{id}

- **Método:** `PATCH`
- **Controller:** `PcmPedidoEdicaoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1248

---

### /projetos/demandas/{id}

- **Método:** `PATCH`
- **Controller:** `DemandasTemporariasController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1285

---

### marca/{id}

- **Método:** `PATCH`
- **Controller:** `MarcaController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1475

---

### modelo/{id}

- **Método:** `PATCH`
- **Controller:** `ModeloController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1476

---

### operadora/{id}

- **Método:** `PATCH`
- **Controller:** `OperadoraController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1477

---

### //{id}

- **Método:** `PATCH`
- **Controller:** `OrdemServicoAtivosExternosController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1480

---

### servico/{id}

- **Método:** `PATCH`
- **Controller:** `ServicoAtivoExternoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1487

---

### /os/receber/{id}

- **Método:** `PATCH`
- **Controller:** `OrdemServicoController::receber`
- **Parâmetros:**
  - `$id`
- **Linha:** 1534

---

### /os/{id}

- **Método:** `PATCH`
- **Controller:** `OrdemServicoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1536

---

### /producao/itens-separados

- **Método:** `PATCH`
- **Controller:** `ProducaoController::atualizaQuantidadeSeparadaItensOp`
- **Linha:** 1694

---

### /producao/{op_cod}/obs

- **Método:** `PATCH`
- **Controller:** `ProducaoController::atualizaObservacaoOp`
- **Parâmetros:**
  - `$op_cod`
- **Linha:** 1695

---

### /sessao/{id}

- **Método:** `PATCH`
- **Controller:** `SessaoTestesController::finalizarSessao`
- **Parâmetros:**
  - `$id`
- **Linha:** 1761

---

### /parametroTeste/produto/{produto_cod}

- **Método:** `PATCH`
- **Controller:** `ParametroTesteController::update`
- **Parâmetros:**
  - `$produto_cod`
- **Linha:** 1777

---

### /{id}

- **Método:** `PATCH`
- **Controller:** `ReuniaoTemaController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1794

---

### /{id}

- **Método:** `PATCH`
- **Controller:** `ReuniaoController::update`
- **Parâmetros:**
  - `$id`
- **Linha:** 1813

---

## DELETE Routes

### /anexos/{entidade}/{id}/{anexo_id}

- **Método:** `DELETE`
- **Controller:** `AnexoController::excluir`
- **Parâmetros:**
  - `$entidade`
  - `$id`
  - `$anexo_id`
- **Linha:** 367

---

### /apagar/{id}

- **Método:** `DELETE`
- **Controller:** `DemDemandaController::apagarDemanda`
- **Parâmetros:**
  - `$id`
- **Linha:** 387

---

### /cotacao/{id}

- **Método:** `DELETE`
- **Controller:** `CompCotacaoController::deletarCotacao`
- **Parâmetros:**
  - `$id`
- **Linha:** 422

---

### /recebimento/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `CompRecebimentoController::excluirRecebimento`
- **Parâmetros:**
  - `$id`
- **Linha:** 439

---

### /excluir/{id}

- **Método:** `DELETE`
- **Controller:** `DemMotivacaoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 463

---

### /excluir/{id}

- **Método:** `DELETE`
- **Controller:** `DemOrigemController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 476

---

### excluir/{id}

- **Método:** `DELETE`
- **Controller:** `DemFamiliaController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 486

---

### excluir/{id}

- **Método:** `DELETE`
- **Controller:** `DemServicoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 495

---

### /excluir/{id}

- **Método:** `DELETE`
- **Controller:** `PosVendaController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 504

---

### /inspecao/deletar/{id}

- **Método:** `DELETE`
- **Controller:** `InspecaoController::delete`
- **Parâmetros:**
  - `$id`
- **Linha:** 529

---

### /excluir/{id}

- **Método:** `DELETE`
- **Controller:** `GestaoMateriaisParametroController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 536

---

### /comentario/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `ProtocoloComentarioController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 560

---

### /anexo/remover/{id}

- **Método:** `DELETE`
- **Controller:** `ProtocoloController::AnexoProtocoloRemover`
- **Parâmetros:**
  - `$id`
- **Linha:** 564

---

### /excluir/{id}

- **Método:** `DELETE`
- **Controller:** `ProtocoloController::ExcluirProtocolo`
- **Parâmetros:**
  - `$id`
- **Linha:** 568

---

### /encerrados/{id}

- **Método:** `DELETE`
- **Controller:** `ProtocoloEncerramentoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 581

---

### /excluir/{id}

- **Método:** `DELETE`
- **Controller:** `RoteiroController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 590

---

### /etapa/{id}

- **Método:** `DELETE`
- **Controller:** `Rot2EtapaController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 600

---

### /tipo/{id}

- **Método:** `DELETE`
- **Controller:** `Rot2TipoEtapaController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 601

---

### /orientacao/{id}

- **Método:** `DELETE`
- **Controller:** `Rot2OrientacaoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 602

---

### /instrucao/{id}

- **Método:** `DELETE`
- **Controller:** `Rot2InstrucaoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 603

---

### /remover/{id}

- **Método:** `DELETE`
- **Controller:** `EstruturaRoteiroController::removerSetor`
- **Parâmetros:**
  - `$id`
- **Linha:** 616

---

### /remover/{id}

- **Método:** `DELETE`
- **Controller:** `SetorServicoController::removerServico`
- **Parâmetros:**
  - `$id`
- **Linha:** 623

---

### /material/remover/{id}

- **Método:** `DELETE`
- **Controller:** `SetorServicoController::removerMaterial`
- **Parâmetros:**
  - `$id`
- **Linha:** 625

---

### /parametro/remover/{id}

- **Método:** `DELETE`
- **Controller:** `SetorServicoController::removerParametro`
- **Parâmetros:**
  - `$id`
- **Linha:** 626

---

### /gabarito/remover/{id}

- **Método:** `DELETE`
- **Controller:** `SetorServicoController::removerGabarito`
- **Parâmetros:**
  - `$id`
- **Linha:** 627

---

### /excluir/{id}

- **Método:** `DELETE`
- **Controller:** `ParametroController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 634

---

### /excluir/{id}

- **Método:** `DELETE`
- **Controller:** `GabaritoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 644

---

### /excluir/{id}

- **Método:** `DELETE`
- **Controller:** `OportunidadeController::excluirOportunidade`
- **Parâmetros:**
  - `$id`
- **Linha:** 657

---

### /responsavel-excluir/{id}

- **Método:** `DELETE`
- **Controller:** `OportunidadeController::excluirOportunidadeResponsavel`
- **Parâmetros:**
  - `$id`
- **Linha:** 662

---

### /finalizacao-excluir/{id}

- **Método:** `DELETE`
- **Controller:** `OportunidadeController::excluirOportunidadeFinalizacao`
- **Parâmetros:**
  - `$id`
- **Linha:** 663

---

### /produto-excluir/{id}

- **Método:** `DELETE`
- **Controller:** `OportunidadeController::excluirOportunidadeProduto`
- **Parâmetros:**
  - `$id`
- **Linha:** 664

---

### /anexo-excluir/{id}

- **Método:** `DELETE`
- **Controller:** `OportunidadeController::excluirOportunidadeAnexo`
- **Parâmetros:**
  - `$id`
- **Linha:** 665

---

### /orcamento-excluir/{id}

- **Método:** `DELETE`
- **Controller:** `OportunidadeController::excluirOportunidadeOrcamento`
- **Parâmetros:**
  - `$id`
- **Linha:** 666

---

### /excluir/{id}

- **Método:** `DELETE`
- **Controller:** `OptOportunidadeController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 678

---

### /remover/{id}

- **Método:** `DELETE`
- **Controller:** `EstruturaProdutoController::removerItem`
- **Parâmetros:**
  - `$id`
- **Linha:** 735

---

### /cliente-temp/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `ClienteTempController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 750

---

### /material-utilizado/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `MaterialUtilizadoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 762

---

### /verbos/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `VerboController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 774

---

### /objetos/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `ObjetoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 781

---

### /locais/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `LocalCodController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 788

---

### /codificacoes/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `CodificacaoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 795

---

### excluir

- **Método:** `DELETE`
- **Controller:** `CampoProdutoController::excluirValores`
- **Linha:** 809

---

### /campos/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `CampoProdutoController::excluirCampo`
- **Parâmetros:**
  - `$id`
- **Linha:** 817

---

### /excluir/{id}

- **Método:** `DELETE`
- **Controller:** `FamiliaProdutoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 836

---

### /unidade-medida/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `UnidadeMedidaProdutoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 843

---

### /dispositivo/{id}

- **Método:** `DELETE`
- **Controller:** `DispositivoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 880

---

### /empresas-contrante/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `EmpresasContratanteController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 924

---

### /cor-raca/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `CorRacaController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 930

---

### /escolaridade/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `EscolaridadeController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 936

---

### /estado-civil/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `EstadoCivilController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 942

---

### /religiao/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `ReligiaoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 948

---

### /tamanho/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `TamanhoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 954

---

### /tipo-conta/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `ContaTipoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 960

---

### /parentesco/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `ParentescoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 966

---

### /tipo-graduacao/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `GraduacaoTipoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 972

---

### /regional/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `RegionalController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 978

---

### /endereco/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `PessoaEnderecoController::excluirEndereco`
- **Parâmetros:**
  - `$id`
- **Linha:** 983

---

### /graduacao/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `PessoaGraduacaoController::excluirGraduacao`
- **Parâmetros:**
  - `$id`
- **Linha:** 987

---

### /contato-emergencia/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `PessoaContatoEmergenciaController::excluirContatoEmergencia`
- **Parâmetros:**
  - `$id`
- **Linha:** 991

---

### /dados-bancarios/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `PessoaDadosBancariosController::excluirDadosBancarios`
- **Parâmetros:**
  - `$id`
- **Linha:** 995

---

### /vinculo-familiar/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `PessoaVinculoController::excluirVinculo`
- **Parâmetros:**
  - `$id`
- **Linha:** 999

---

### /trajeto/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `PessoaTrajetoController::excluirTrajeto`
- **Parâmetros:**
  - `$id`
- **Linha:** 1003

---

### /admissao/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `PessoaAdmissaoController::excluirAdmissao`
- **Parâmetros:**
  - `$id`
- **Linha:** 1007

---

### /motivos/{id}

- **Método:** `DELETE`
- **Controller:** `MotivoDemissaoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1015

---

### /pessoa/{id}

- **Método:** `DELETE`
- **Controller:** `PessoaController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1037

---

### /projeto/encerrados/{id}

- **Método:** `DELETE`
- **Controller:** `EncerramentoProjetoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1063

---

### /cargo/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `CargoController::ExcluirCargo`
- **Parâmetros:**
  - `$id`
- **Linha:** 1078

---

### /desassociar/pessoa-cargo/{id}

- **Método:** `DELETE`
- **Controller:** `CargoController::DesassociarPessoaCargo`
- **Parâmetros:**
  - `$id`
- **Linha:** 1080

---

### /{id}

- **Método:** `DELETE`
- **Controller:** `SetorController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1095

---

### /estrutura/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `EstruturaDREController::ExcluirItemEstrutura`
- **Parâmetros:**
  - `$id`
- **Linha:** 1144

---

### /categoria/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `CategoriaDREController::ExcluirCategoriaDRE`
- **Parâmetros:**
  - `$id`
- **Linha:** 1147

---

### /categoria/desassociar/responsavel/{id}

- **Método:** `DELETE`
- **Controller:** `CategoriaDREGruposController::removerVinculo`
- **Parâmetros:**
  - `$id`
- **Linha:** 1161

---

### exercicio-financeiro/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `ExercicioFinanceiroController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1171

---

### injecao/maquina/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `MaquinaController::ExcluirMaquina`
- **Parâmetros:**
  - `$id`
- **Linha:** 1187

---

### injecao/motivo/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `InjetoraMotivoController::ExcluirMotivo`
- **Parâmetros:**
  - `$id`
- **Linha:** 1204

---

### /planoAcaoTarefa/anexo/remover/{id}

- **Método:** `DELETE`
- **Controller:** `PlanoAcaoTarefaController::AnexoPlanoAcaoTarefaRemover`
- **Parâmetros:**
  - `$id`
- **Linha:** 1238

---

### /pedidos-edicao/{id}

- **Método:** `DELETE`
- **Controller:** `PcmPedidoEdicaoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1248

---

### /projeto/anexo/remover/{id}

- **Método:** `DELETE`
- **Controller:** `ProjetoController::AnexoProjetoRemover`
- **Parâmetros:**
  - `$id`
- **Linha:** 1271

---

### /sprintTarefa/anexo/remover/{id}

- **Método:** `DELETE`
- **Controller:** `SprintTarefaController::AnexoSprintTarefaRemover`
- **Parâmetros:**
  - `$id`
- **Linha:** 1274

---

### /projetos/demandas/{id}

- **Método:** `DELETE`
- **Controller:** `DemandasTemporariasController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1285

---

### inventario/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `InventarioController::ExcluirInventario`
- **Parâmetros:**
  - `$id`
- **Linha:** 1317

---

### status-ativo/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `StatusAtivoController::ExcluirStatusAtivo`
- **Parâmetros:**
  - `$id`
- **Linha:** 1325

---

### ativo/notificacao/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `AtivosNotificacaoController::ExcluirNotificacaoAtivo`
- **Parâmetros:**
  - `$id`
- **Linha:** 1328

---

### ativos/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `AtivosController::ExcluirAtivos`
- **Parâmetros:**
  - `$id`
- **Linha:** 1343

---

### categoria/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `CategoriaController::ExcluirCategoria`
- **Parâmetros:**
  - `$id`
- **Linha:** 1361

---

### local-fisico/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `LocalFisicoController::ExcluirLocalFisico`
- **Parâmetros:**
  - `$id`
- **Linha:** 1367

---

### motivo-alerta/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `MotivoAlertaController::ExcluirMotivoAlerta`
- **Parâmetros:**
  - `$id`
- **Linha:** 1372

---

### status-ativo/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `StatusAtivoController::ExcluirStatusAtivo`
- **Parâmetros:**
  - `$id`
- **Linha:** 1377

---

### /indicador/{id}

- **Método:** `DELETE`
- **Controller:** `IndicadorController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1394

---

### /os/motivo/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `OrdemServicoMotivoController::ExcluirMotivo`
- **Parâmetros:**
  - `$id`
- **Linha:** 1442

---

### /os/trabalho/material/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `OrdemServicoTrabalhoController::ExcluirMaterialGasto`
- **Parâmetros:**
  - `$id`
- **Linha:** 1450

---

### /os/porta-molde/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `OrdemServicoPortaMoldeController::ExcluirPortaMolde`
- **Parâmetros:**
  - `$id`
- **Linha:** 1454

---

### /os/objeto-servico/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `OrdemServicoObjetoController::ExcluirObjetoServico`
- **Parâmetros:**
  - `$id`
- **Linha:** 1458

---

### /os/tipo-servico/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `OrdemServicoTipoController::ExcluirTipoServico`
- **Parâmetros:**
  - `$id`
- **Linha:** 1462

---

### /os/material-trabalho/excluir/{id}

- **Método:** `DELETE`
- **Controller:** `OrdemServicoMaterialController::ExcluirMaterial`
- **Parâmetros:**
  - `$id`
- **Linha:** 1467

---

### marca/{id}

- **Método:** `DELETE`
- **Controller:** `MarcaController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1475

---

### modelo/{id}

- **Método:** `DELETE`
- **Controller:** `ModeloController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1476

---

### operadora/{id}

- **Método:** `DELETE`
- **Controller:** `OperadoraController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1477

---

### //{id}

- **Método:** `DELETE`
- **Controller:** `OrdemServicoAtivosExternosController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1480

---

### servico/{id}

- **Método:** `DELETE`
- **Controller:** `ServicoAtivoExternoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1487

---

### /os/material/{id}

- **Método:** `DELETE`
- **Controller:** `OrdemServicoMaterialController::delete`
- **Parâmetros:**
  - `$id`
- **Linha:** 1526

---

### /visitante/{id}

- **Método:** `DELETE`
- **Controller:** `PessoaVisitanteController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1551

---

### /local/{id}

- **Método:** `DELETE`
- **Controller:** `LocalController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1560

---

### /acesso/{id}

- **Método:** `DELETE`
- **Controller:** `AcessoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1567

---

### /meta/{id}

- **Método:** `DELETE`
- **Controller:** `MetaController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1575

---

### /sistema/{id}

- **Método:** `DELETE`
- **Controller:** `SistemaController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1593

---

### /grupo/{id}

- **Método:** `DELETE`
- **Controller:** `GrupoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1602

---

### /usuario/grupo

- **Método:** `DELETE`
- **Controller:** `GrupoController::excluiUsuarioGrupo`
- **Linha:** 1612

---

### /usuarios/grupo

- **Método:** `DELETE`
- **Controller:** `GrupoController::excluiUsuariosGrupo`
- **Linha:** 1614

---

### /usuario/{id}

- **Método:** `DELETE`
- **Controller:** `AuthController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1628

---

### /funcionalidade/{id}

- **Método:** `DELETE`
- **Controller:** `FuncionalidadeController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1640

---

### /func/grupo

- **Método:** `DELETE`
- **Controller:** `FuncionalidadeController::excluiFuncGrupo`
- **Linha:** 1647

---

### /funcs/grupo

- **Método:** `DELETE`
- **Controller:** `FuncionalidadeController::excluiFuncsGrupo`
- **Linha:** 1648

---

### /seguimento/{id}

- **Método:** `DELETE`
- **Controller:** `SeguimentoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1663

---

### /cliente/{id}

- **Método:** `DELETE`
- **Controller:** `ClienteController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1679

---

### /setor-executante/{id}

- **Método:** `DELETE`
- **Controller:** `SetorExecutanteController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1711

---

### /trabalho/{id}

- **Método:** `DELETE`
- **Controller:** `TrabalhoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1724

---

### /tipoProduto/{id}

- **Método:** `DELETE`
- **Controller:** `TipoProdutoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1732

---

### /giga/{id}

- **Método:** `DELETE`
- **Controller:** `GigaController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1753

---

### /sessao/{id}

- **Método:** `DELETE`
- **Controller:** `SessaoTestesController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1759

---

### /teste/{id}

- **Método:** `DELETE`
- **Controller:** `TesteController::delete`
- **Parâmetros:**
  - `$id`
- **Linha:** 1772

---

### /parametroTeste/{produto_cod}

- **Método:** `DELETE`
- **Controller:** `ParametroTesteController::delete`
- **Parâmetros:**
  - `$produto_cod`
- **Linha:** 1779

---

### /ciclo/{id}

- **Método:** `DELETE`
- **Controller:** `CicloController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1785

---

### /{id}

- **Método:** `DELETE`
- **Controller:** `ReuniaoTemaController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1795

---

### /{id}

- **Método:** `DELETE`
- **Controller:** `ReuniaoController::destroy`
- **Parâmetros:**
  - `$id`
- **Linha:** 1814

---

