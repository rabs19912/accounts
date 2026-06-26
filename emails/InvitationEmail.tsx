import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface InvitationEmailProps {
  inviterName: string;
  groupName: string;
  acceptUrl: string;
}

export function InvitationEmail({
  inviterName,
  groupName,
  acceptUrl,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{inviterName} te invitó a compartir gastos en Accounts</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Accounts</Heading>
          <Section style={card}>
            <Text style={text}>
              <strong>{inviterName}</strong> te invitó a compartir gastos en el
              grupo <strong>{groupName}</strong>.
            </Text>
            <Text style={subtext}>
              Hacé click en el botón para aceptar la invitación. El link es
              válido por 24 horas.
            </Text>
            <Button style={button} href={acceptUrl}>
              Aceptar invitación
            </Button>
          </Section>
          <Text style={footer}>
            Si no esperabas esta invitación, podés ignorar este correo.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f0f9ff",
  fontFamily: "sans-serif",
};

const container = {
  maxWidth: "480px",
  margin: "40px auto",
  padding: "0 16px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#0284c7",
  marginBottom: "24px",
};

const card = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "32px",
  border: "1px solid #e2e8f0",
};

const text = {
  fontSize: "16px",
  color: "#1e293b",
  lineHeight: "1.6",
};

const subtext = {
  fontSize: "14px",
  color: "#64748b",
  lineHeight: "1.6",
};

const button = {
  backgroundColor: "#0284c7",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
  display: "inline-block",
  marginTop: "8px",
};

const footer = {
  fontSize: "12px",
  color: "#94a3b8",
  marginTop: "24px",
  textAlign: "center" as const,
};
