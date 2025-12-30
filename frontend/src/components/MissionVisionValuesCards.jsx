import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  Grid
} from "@mui/material";

import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import HandshakeOutlinedIcon from "@mui/icons-material/HandshakeOutlined";

import { motion } from "framer-motion";

const items = [
  {
    title: "Nuestra Misión",
    subtitle: "Cambiar el destino de las personas",
    icon: FlagOutlinedIcon,
    text: `Gestionamos el patrimonio con discreción y visión estratégica dentro
    de un enfoque de Arquitectura Financiera Múltiple, brindando herramientas
    para la construcción de capital y la protección del futuro económico de
    nuestros clientes y colaboradores.`
  },
  {
    title: "Nuestra Visión",
    subtitle: "Ser la compañía elegida",
    icon: VisibilityOutlinedIcon,
    text: `Queremos ser la compañía elegida por personas, familias y empresas
    por nuestra transparencia, efectividad, liderazgo y asesoramiento integral,
    respaldados por más de diez años de trayectoria y una red de profesionales
    altamente calificados.`
  },
  {
    title: "Nuestros Valores",
    subtitle: "Los pilares que nos definen",
    icon: HandshakeOutlinedIcon,
    text: `Dinamismo, compromiso y cercanía son los valores sobre los cuales
    construimos nuestro presente y futuro, trabajando con profesionalismo,
    vocación de servicio y foco en el bienestar de nuestros clientes.`
  }
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export default function MissionVisionValuesCards() {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <Container maxWidth="lg" sx={{ mb: 10 }}>
        <Grid container spacing={4}>
          {items.map((item, index) => {
            const Icon = item.icon;

            return (
              <Grid item xs={12} md={4} key={index}>
                <motion.div variants={cardVariants} whileHover={{ y: -8 }}>
                  <Card
                    sx={{
                      height: "300px",
                      borderRadius: 4,
                      boxShadow: 4,
                      textAlign: "center",
                      transition: "0.3s"
                    }}
                  >
                    <CardContent>
                      <Box sx={{ mb: 2, color: "#0A5C8D" }}>
                        <Icon sx={{ fontSize: 60 }} />
                      </Box>

                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {item.title}
                      </Typography>

                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 2, color: "text.secondary" }}
                      >
                        {item.subtitle}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        {item.text}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </motion.section>
  );
}
