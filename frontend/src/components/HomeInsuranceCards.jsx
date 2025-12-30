import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid
} from "@mui/material";

import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import FamilyRestroomOutlinedIcon from "@mui/icons-material/FamilyRestroomOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";

const cards = [
  {
    title: "Ahorro y Retiro",
    subtitle: "Planes de Ahorro y Retiro",
    icon: <SavingsOutlinedIcon sx={{ fontSize: 48 }} />,
    bullets: [
      "Ahorro sistemático y planificado",
      "Capitalización a largo plazo",
      "Mantiene tu estándar de vida al retirarte",
      "Ideal para proyectos e imprevistos"
    ],
    cta: "Solicitar información"
  },
  {
    title: "Protección Familiar",
    subtitle: "Planes de Protección Familiar",
    icon: <FamilyRestroomOutlinedIcon sx={{ fontSize: 48 }} />,
    bullets: [
      "Seguro de vida",
      "Cobertura por fallecimiento e invalidez",
      "Protección económica para tu familia",
      "Planes adaptados a cada necesidad"
    ],
    cta: "Hablar con un asesor"
  },
  {
    title: "Seguros Patrimoniales",
    subtitle: "Protegé lo que es importante",
    icon: <ShieldOutlinedIcon sx={{ fontSize: 48 }} />,
    bullets: [
      "Automotor, Hogar y Comercio",
      "Accidentes Personales y Mala Praxis",
      "Lucro Cesante y Deportes de Riesgo",
      "Salud y ART"
    ],
    cta: "Cotizar ahora"
  }
];

export default function HomeInsuranceCards() {
  return (
    <Box sx={{ py: 6 }}>
      <Grid container spacing={4}>
        {cards.map((card, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card
              sx={{
                height: "100%",
                textAlign: "center",
                borderRadius: 3,
                boxShadow: 3,
                transition: "0.3s",
                "&:hover": {
                  transform: "translateY(-6px)",
                  boxShadow: 6
                }
              }}
            >
              <CardContent>
                <Box sx={{ color: "primary.main", mb: 2 }}>
                  {card.icon}
                </Box>

                <Typography variant="h6" fontWeight="bold">
                  {card.title}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {card.subtitle}
                </Typography>

                <Box component="ul" sx={{ textAlign: "left", pl: 2 }}>
                  {card.bullets.map((item, i) => (
                    <li key={i}>
                      <Typography variant="body2">{item}</Typography>
                    </li>
                  ))}
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 3, borderRadius: 2 }}
                >
                  {card.cta}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
