import { useEffect, useState } from "react";
import { AlertCircle, Building2, FileCheck2, UserRound, type LucideIcon } from "lucide-react";
import { mockStore } from "@/lib/mock-store";
import { getAddress, getPersonalInformation } from "@/services/api";

export type CampaignPrerequisiteStatus = "complete" | "pending" | "blocked" | "attention";

export type CampaignPrerequisite = {
  id: string;
  title: string;
  description: string;
  href: string;
  action: string;
  status: CampaignPrerequisiteStatus;
  icon: LucideIcon;
};

type ReadinessState = {
  loading: boolean;
  items: CampaignPrerequisite[];
};

const REQUIRED_PERSONAL_FIELDS = [
  "full_name",
  "cpf",
  "phone",
  "gender",
  "marital_status",
  "birth_date",
];

const REQUIRED_ADDRESS_FIELDS = ["zip_code", "state", "city", "district", "street_name", "number"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function unwrapData(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const data = value.data;
  return isRecord(data) ? data : value;
}

function hasRequiredFields(value: Record<string, unknown> | null, fields: string[]) {
  if (!value) return false;

  return fields.every((field) => {
    const current = value[field];
    return typeof current === "string"
      ? current.trim().length > 0
      : current !== null && current !== undefined;
  });
}

function buildItems(
  personal: unknown,
  address: unknown,
  personalFailed: boolean,
  addressFailed: boolean,
) {
  const personalData = unwrapData(personal);
  const addressData = unwrapData(address);
  const requiredDocs = mockStore.getDocs().filter((doc) => doc.required);
  const missingDocs = requiredDocs.filter((doc) => doc.status === "missing");
  const personalComplete = hasRequiredFields(personalData, REQUIRED_PERSONAL_FIELDS);
  const addressComplete = hasRequiredFields(addressData, REQUIRED_ADDRESS_FIELDS);

  return [
    {
      id: "personal-profile",
      title: "Perfil pessoal",
      description: personalFailed
        ? "Não foi possível validar os dados pessoais agora."
        : personalComplete
          ? "Dados pessoais mínimos encontrados."
          : "Complete CPF, telefone e dados básicos do responsável.",
      href: "/app/perfil-pessoal",
      action: personalComplete ? "Revisar perfil" : "Completar perfil",
      status: personalComplete ? "complete" : "pending",
      icon: UserRound,
    },
    {
      id: "company-address",
      title: "Endereço da empresa",
      description: addressFailed
        ? "Não foi possível validar o endereço cadastrado agora."
        : addressComplete
          ? "Endereço operacional encontrado."
          : "Informe endereço, número, cidade, estado e CEP.",
      href: "/app/perfil-empresa",
      action: addressComplete ? "Revisar empresa" : "Completar empresa",
      status: addressComplete ? "complete" : "pending",
      icon: Building2,
    },
    {
      id: "company-contract",
      title: "CNPJ e status da empresa",
      description:
        "O contrato atual ainda não expõe persistência ou consulta de CNPJ/status operacional para liberar campanhas.",
      href: "/app/perfil-empresa",
      action: "Revisar limitação",
      status: "blocked",
      icon: AlertCircle,
    },
    {
      id: "documents",
      title: "Documentos CVM 88",
      description:
        missingDocs.length === 0
          ? "Documentos obrigatórios marcados como enviados neste ambiente."
          : `${missingDocs.length} documento(s) obrigatório(s) ainda pendente(s).`,
      href: "/app/documentos",
      action: missingDocs.length === 0 ? "Revisar documentos" : "Enviar documentos",
      status: missingDocs.length === 0 ? "complete" : "pending",
      icon: FileCheck2,
    },
  ] satisfies CampaignPrerequisite[];
}

export function useCampaignReadiness(): ReadinessState {
  const [state, setState] = useState<ReadinessState>(() => ({
    loading: true,
    items: buildItems(null, null, false, false),
  }));

  useEffect(() => {
    let active = true;

    async function load() {
      const [personalResult, addressResult] = await Promise.allSettled([
        getPersonalInformation(),
        getAddress(),
      ]);

      if (!active) return;

      setState({
        loading: false,
        items: buildItems(
          personalResult.status === "fulfilled" ? personalResult.value : null,
          addressResult.status === "fulfilled" ? addressResult.value : null,
          personalResult.status === "rejected",
          addressResult.status === "rejected",
        ),
      });
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function getBlockingPrerequisites(items: CampaignPrerequisite[]) {
  return items.filter((item) => item.status === "pending" || item.status === "blocked");
}
