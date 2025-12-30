import React, { useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Container,
  CardMedia,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Stack,
  Chip,
  IconButton,
  CardHeader,
  CardActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// Icons
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import SchoolIcon from '@mui/icons-material/School';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import WorkIcon from '@mui/icons-material/Work';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PublicSearchesCarousel from "../components/PublicSearchesCarousel";
import Typewriter from "../components/Typewriter";
import Footer from '../components/footer';
import { AuthContext } from '../context/AuthContext';
import HomeInsuranceCards from '../components/HomeInsuranceCards';
// ===== Variants =====
// Hero: fondo con ken-burns + contenido fade-up
const heroBgVariants = {
  initial: { scale: 1.02 },
  animate: { scale: 1.07, transition: { duration: 12, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' } },
};
const heroContentVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

// Cards “¿Aceptás el desafío?”
const imgVariants = {
  rest: { scale: 1, filter: 'brightness(1)', transition: { type: 'spring', stiffness: 120, damping: 15 } },
  hover: { scale: 1.06, filter: 'brightness(0.8)', transition: { type: 'spring', stiffness: 120, damping: 15 } },
};
const overlayVariants = {
  rest: { opacity: 0, y: 20, transition: { duration: 0.25 } },
  hover: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

// Secciones animadas
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { when: 'beforeChildren', staggerChildren: 0.12 }
  },
};
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 18 }
  },
};

// ===== Datos =====
const valores = [
  {
    title: "Una Misión",
    subtitle: "Cambiar el destino de las personas",
    icon: FlagOutlinedIcon,
    text: `Gestionamos el patrimonio con discreción y visión estratégica, brindando herramientas para la construcción de capital y la protección del futuro económico de nuestros valiosos clientes y colaboradores, con un enfoque de Arquitectura Financiera Múltiple.`,
  },

  {
    title: "Una Visión",
    subtitle: "Ser la compañía elegida.",
    icon: VisibilityOutlinedIcon,
    text: `Ser la compañía elegida por personas, familias y empresas por nuestra transparencia, efectividad y liderazgo, ofreciendo asesoramiento integral, respaldados por más de diez años de trayectoria y una red de profesionales altamente calificados y comprometidos.`,
  },
  {
    title: "Nuestros Valores",
    subtitle: "Los pilares que nos definen.",
    icon: HandshakeOutlinedIcon,
    text: `Dinamismo, compromiso y cercanía son los valores que guían nuestras acciones, construyendo el presente y futuro con profesionalismo, vocación de servicio y un foco absoluto en el bienestar y prosperidad de nuestros valiosos clientes y colaboradores.`,
  },
];


const areas = [
  { title: 'Comercial', tags: ['Atención al Cliente', 'Asesor de Seguros', ''], img: 'https://images.unsplash.com/photo-1758518729908-d4220a678d81?q=80&w=1331&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', path: '/searches?area=Comercial' },
  { title: 'Administración', tags: ['Cobranzas', 'Facturación', 'Gestión de Pólizas'], img: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=60', path: '/searches?area=Administracion' },
  { title: 'Finanzas', tags: ['Contabilidad', 'Auditoría', 'Cumplimiento'], img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=60', path: '/searches?area=Finanzas' },
  { title: 'Recursos Humanos', tags: ['Selección de Personal', 'Liquidación de Sueldos'], img: 'https://images.unsplash.com/photo-1686771416282-3888ddaf249b?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', path: '/searches?area=Recursos Humanos' }
];
const heroTaglines = [
  "El éxito de una buena planificación financiera personal",
  "reside en lograr el equilibrio justo en la relación ",
  "entre el cliente, su asesor financiero y las compañías.",
];
const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Auto-rotate testimonios
  const handleApplyClick = () => {
    if (user) {
      navigate('/profile');
    } else {
      navigate('/register');
    }
  };


  return (
    <Box sx={{ 
        backgroundColor: '#f4f6f8',
        
        // ESTAS 3 LÍNEAS SALVAN EL DISEÑO EN 900-1200px:
        width: '100%',
        maxWidth: '100vw',  // Asegura que NADA pase del ancho de ventana
        overflowX: 'hidden' // Corta cualquier animación o grid rebelde
    }}>

      {/* ===== HERO con animaciones ===== */}
      <Box
        sx={{
          position: 'relative',
          height: '50vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center',
          mb: 4,
        }}
      >
        <motion.div
          variants={heroBgVariants}
          initial="initial"
          animate="animate"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: "url('/001.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            willChange: 'transform',
          }}
        />
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0, 0, 0, 0.5)', zIndex: 1 }} />
        <Container maxWidth="md" sx={{ zIndex: 2 }}>
          <motion.div variants={heroContentVariants} initial="hidden" animate="visible" >
            <Typography variant="h2" component="h1" gutterBottom>
              Bienvenido
            </Typography>
           <Typography
              variant="h5"
              component="div" // Importante: usar 'div' para que el span del Typewriter sea válido
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                maxWidth: '700px',
                margin: 'auto',
                minHeight: '2.5em' // Da un espacio fijo para que no "salte"
              }}
            >
              <Typewriter
                text={heroTaglines}
                loop={true}
                speed={50}
                deleteSpeed={30}
                waitTime={1500}
                // Hacemos que el cursor tenga el mismo estilo que el texto
                cursorClassName="MuiTypography-h5" 
              />
            </Typography>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} style={{ marginTop: 24 }}>
              <Button
                variant="contained"
                onClick={handleApplyClick}
                sx={{
                  backgroundColor: '#0A5C8D',
                  '&:hover': { backgroundColor: '#084a70' },
                  px: 4, py: 1.5, fontWeight: 'bold'
                }}
              >
                Postularme
              </Button>
            </motion.div>
          </motion.div>
        </Container>
      </Box>

      {/* ===== VALORES / CULTURA ===== */}
      <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
        <Container maxWidth="lg" sx={{ mb: 8 , justifyItems: "center"}} >
          <Typography variant="h4" gutterBottom textAlign="center">
            En <span style={{ color: '#0A5C8D', fontWeight: 'bold' }}>PRIORITY GROUP</span> 
          </Typography>
          <Typography variant="h4" gutterBottom textAlign="center">tenemos</Typography>
          <br />
          <Grid container spacing={3} sx={{ display: { xs: "grid" , width: "max-content",justifyContent: "space-around" , lg : "flex" }}}>
            {valores.map((v, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                <motion.div variants={cardVariants} whileHover={{ y: -6 }} style={{ height: '100%' }}>
                  <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 3, boxShadow: 3, width: "360px" }}>
                    <CardHeader
                      title={v.title}
                      titleTypographyProps={{ align: 'center', variant: 'h5', fontWeight: 'bold', color: '#0A5C8D' }}
                    />
                    <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{
                          duration: 5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <v.icon sx={{ fontSize: 60, mb: 2, color: '#0A5C8D' }} />
                      </motion.div>
                      {v.subtitle && (
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#0A5C8D' }}>
                          {v.subtitle}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {v.text}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                      {/* <Button size="small" sx={{ color: '#0A5C8D' }}>
                        Saber más
                      </Button> */}
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </motion.section>
            
      {/* ===== CARROUSEL DE PUBLICACIONES ===== */}
      
      <Box sx={{ display: { md: 'block' }, width: '100%', overflow: 'hidden' }}>
  
  <motion.section 
    variants={sectionVariants} 
    initial="hidden" 
    whileInView="visible" 
    viewport={{ once: true, amount: 0.2 }}
    style={{ width: '100%' }}
  >
    <Container maxWidth="lg" sx={{ mb: 2 }}>
      <PublicSearchesCarousel />
    </Container>
  </motion.section>

</Box>
      
   
      {/* ===== OPORTUNIDADES POR ÁREA ===== */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <Container maxWidth="lg" sx={{ mb: 8 }}>
          
          <Typography variant="h4" gutterBottom textAlign="center">
            Áreas de Oportunidad
          </Typography>
          <Grid container spacing={3} sx={{ justifyContent: " flex-end" }}>
            {areas.map((a, i) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i} style={{ display: "flex", justifyContent: "center" }}>
                <motion.div variants={cardVariants} whileHover={{ y: -6, scale: 1.01 }}>
                  <Card
                    sx={{
                      width: "250px",
                      borderRadius: 3,
                      overflow: "hidden",
                      boxShadow: 4,
                      display: "flex",
                      flexDirection: "column",
                      height: "360px",
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={a.img}
                      alt={a.title}
                      sx={{
                        height: 160,
                        width: "100%",
                        objectFit: "cover"
                      }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom noWrap>
                        {a.title}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ maxHeight: 60, overflow: "hidden" }}>
                        {a.tags.map((t) => (
                          <Chip key={t} label={t} size="small" />
                        ))}
                      </Stack>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => navigate(a.path)}
                        sx={{
                          backgroundColor: '#0A5C8D',
                          color: 'white',
                          '&:hover': { backgroundColor: '#084a70' }
                        }}
                      >
                        Ver vacantes
                      </Button>
                    </Box>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </motion.section>


      {/* ===== FAQ ===== */}
      <Container maxWidth="md" sx={{ mb: 10 }}>
        <Typography variant="h4" gutterBottom textAlign="center">Preguntas frecuentes</Typography>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>¿Cómo es el proceso de selección?</AccordionSummary>
          <AccordionDetails>
            Realizamos un primer screening de CV, entrevista con RRHH y entrevista técnica/cultural con el equipo. Te mantenemos informado en cada etapa.
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>¿En qué áreas puedo postularme?</AccordionSummary>
          <AccordionDetails>
            Comercial, Administración, Finanzas y Recursos Humanos. También recibimos postulaciones espontáneas.
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>¿Qué pasa después de cargar mi CV?</AccordionSummary>
          <AccordionDetails>
            Nuestro equipo evalúa tu perfil y, si hay match, te contactamos para los siguientes pasos. Guardamos tu CV para futuras búsquedas.
          </AccordionDetails>
        </Accordion>
      </Container>

      {/* ===== CTA final ===== */}
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', py: 6, backgroundColor: 'white', borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h4" gutterBottom>¿Te gustaría trabajar con nosotros?</Typography>
          <Typography variant="h6" sx={{ mb: 3 }}>Subí tu CV y sumate a nuestra base de talentos.</Typography>
          <Button variant="contained" onClick={handleApplyClick} sx={{
            px: 4, py: 1.5, fontWeight: 'bold',
            backgroundColor: '#0A5C8D',
            '&:hover': { backgroundColor: '#084a70' }
          }}>
            Cargar mi CV
          </Button>
        </Box>
      </Container>
      <Footer />
    </Box>

  );
};

export default Home;
