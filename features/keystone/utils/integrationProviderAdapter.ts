// Mirrors paymentProviderAdapter.ts: the provider row stores the adapter slug
// (or an http URL for a remote adapter) in each *Function field.
export async function executeAdapterFunction({
  provider,
  functionName,
  exportName = functionName,
  args,
}: {
  provider: Record<string, any>;
  functionName: string;
  exportName?: string;
  args: Record<string, unknown>;
}) {
  const functionPath = provider[functionName];
  if (!functionPath) {
    throw new Error(`Integration provider has no ${functionName} configured`);
  }

  if (functionPath.startsWith("http")) {
    const response = await fetch(functionPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, functionName: exportName, ...args }),
    });

    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.statusText}`);
    }
    return response.json();
  }

  const adapter = await import(
    `../../integrations/${provider.providerType}/${functionPath}.ts`
  );

  const fn = adapter[exportName];
  if (!fn) {
    throw new Error(
      `Function ${exportName} not found in adapter ${provider.providerType}/${functionPath}`
    );
  }

  try {
    return await fn({ provider, ...args });
  } catch (error) {
    throw new Error(
      `Error executing ${exportName} for provider ${functionPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

type Provider = Record<string, any>;

export async function validateProviderConfiguration({ provider }: { provider: Provider }) {
  return executeAdapterFunction({
    provider,
    functionName: "submitFunction",
    exportName: "validateConfigurationFunction",
    args: {},
  });
}

export async function validatePrescriber({ provider, npi }: { provider: Provider; npi: string }) {
  return executeAdapterFunction({
    provider,
    functionName: "submitFunction",
    exportName: "validatePrescriberFunction",
    args: { npi },
  });
}

export async function submitWorkflow({
  provider,
  payload,
  idempotencyKey,
}: {
  provider: Provider;
  payload: unknown;
  idempotencyKey: string;
}) {
  return executeAdapterFunction({
    provider,
    functionName: "submitFunction",
    args: { payload, idempotencyKey },
  });
}

export async function getWorkflowStatus({
  provider,
  externalReference,
}: {
  provider: Provider;
  externalReference: string;
}) {
  return executeAdapterFunction({
    provider,
    functionName: "statusFunction",
    args: { externalReference },
  });
}

export async function handleWebhook({
  provider,
  event,
  headers,
}: {
  provider: Provider;
  event: unknown;
  headers: Record<string, string>;
}) {
  return executeAdapterFunction({
    provider,
    functionName: "webhookFunction",
    args: { event, headers },
  });
}
