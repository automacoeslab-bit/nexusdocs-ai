// src/components/diagrams/C4Template.ts
// Templates base — sem classDef, sem init.
// O componente MermaidDiagram injeta tudo via injectTheme().

export const C4Templates = {
  /** C4 Level 1 — Context: sistema central + atores + externos */
  context: `
flowchart TD

Sistema["Sistema Principal"]:::system
Ator["Usuário / Ator"]:::external
Externo["Sistema Externo"]:::external

Ator --> Sistema
Sistema --> Externo

class Sistema system
class Ator,Externo external
  `.trim(),

  /** C4 Level 2 — Container: apps, APIs, bancos de dados */
  container: `
flowchart TD

U["Usuário"]:::external

subgraph Sistema ["Sistema Principal"]
    APP["Aplicação Web"]:::container
    API["API Gateway"]:::container
    AI["AI Engine"]:::system
    DB[("Banco de Dados")]:::database
    Cache[("Cache / Redis")]:::database
end

Externo["Serviço Externo"]:::external

U --> APP
APP --> API
API --> AI
API --> DB
API --> Cache
AI --> Externo

class U,Externo external
class APP,API container
class AI system
class DB,Cache database
  `.trim(),

  /** C4 Level 3 — Component: módulos internos de um contêiner */
  component: `
flowchart TD

Cliente["Cliente Externo"]:::external

subgraph Modulo ["Módulo Principal"]
    Orch["Orchestrator"]:::system
    Service["Serviço de Negócio"]:::container
    Repository["Repositório"]:::container
    Queue{"Fila de Eventos"}:::decision
end

DB[("Banco de Dados")]:::database

Cliente --> Orch
Orch --> Service
Service --> Repository
Service --> Queue
Repository --> DB

class Cliente external
class Orch system
class Service,Repository container
class Queue decision
class DB database
  `.trim(),

  /** Template em branco */
  blank: `flowchart TD\n`,
};
