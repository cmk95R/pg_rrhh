import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box, Container, Grid, Typography, Card,
  Button, TextField, MenuItem, Stack, Snackbar, Alert, Skeleton,
  Stepper, Step, StepLabel, CircularProgress, Fade, IconButton, Link,
  Dialog, DialogContent, DialogActions, InputAdornment, Divider, useTheme
} from "@mui/material";
import { styled } from '@mui/material/styles';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  // --- NUEVOS ICONOS AGREGADOS ---
  School as SchoolIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  WorkspacePremium as CertificateIcon,
  Work as WorkIcon,          // Para Experiencia (si actualizas ese form)
  Person as PersonIcon,      // Para Datos Personales (si actualizas ese form)
  Cake as CakeIcon,          // Para Datos Personales (si actualizas ese form)
  Description as DescriptionIcon // Para Datos Personales (si actualizas ese form)
} from "@mui/icons-material";
import DownloadIcon from "@mui/icons-material/Download";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css'; // Opcional: para capa de texto
import 'react-pdf/dist/Page/TextLayer.css';       // Opcional: para selección de texto

// APIs
import { profileApi } from "../api/auth";
import { getMyCvApi, upsertMyCv, upsertMyCvJson, getMyCvDownloadUrlApi } from "../api/cv";
// import { editUserApi } from "../api/users"; // Comentado si no se usa

// Componentes
import DireccionAR from "../components/DireccionAR";

// Configuración del worker de PDF.js (usando CDN para compatibilidad rápida)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Utils
// import { normalizeDireccion } from "../utils/normalize"; 

// Constantes
const nivelesAcademicos = [
  "Secundario completo", "Secundario incompleto", "Terciario/Técnico en curso",
  "Terciario/Técnico completo", "Universitario en curso", "Universitario completo",
  "Posgrado en curso", "Posgrado completo", "Curso/Bootcamp"
];
const currentYear = new Date().getFullYear();
const yearsList = Array.from({ length: 70 }, (_, i) => currentYear + 5 - i);
const steps = ['Datos Personales', 'Contacto', 'Educación', 'Experiencia', 'Adjuntar CV', 'Revisar y Guardar'];

// Helper para calcular edad
const calculateAge = (dateString) => {
  if (!dateString) return 0;
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Componente para ocultar el input de archivo
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// --- Componente principal ---
export default function ProfileWizard() {
  const [loading, setLoading] = useState(true);
  const [cvData, setCvData] = useState({});
  const [user, setUser] = useState(null); // eslint-disable-line no-unused-vars
  const [snack, setSnack] = useState({ open: false, severity: "success", msg: "" });
  const [activeStep, setActiveStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [{ data: me }, { data: cvResp }] = await Promise.all([profileApi(), getMyCvApi()]);
      const userData = me?.user || {};
      const cv = cvResp?.cv || {};

      setUser(userData);

      // --- LÓGICA DE FUSIÓN ---
      setCvData({
        ...cv,
        ...userData,
        nombre: cv?.nombre ?? userData?.nombre ?? "",
        apellido: cv?.apellido ?? userData?.apellido ?? "",
        email: cv?.email ?? userData?.email ?? "",
      });
    } catch (e) {
      console.error(e);
      setSnack({ open: true, severity: "error", msg: "No se pudo cargar tu perfil." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDataChange = (field, value) => {
    setCvData(prevData => ({ ...prevData, [field]: value }));
  };

  const handleDireccionChange = useCallback((dir) => {
    setCvData(prev => ({ ...prev, direccion: dir }));
  }, []);

  const handleExperienceChange = (newExperiences) => {
    setCvData(prevData => ({ ...prevData, experiencia: newExperiences }));
  };

  const handleEducationChange = (newEducation) => {
    setCvData(prevData => ({ ...prevData, educacion: newEducation }));
  };

  const handleFinalSave = async () => {
    setIsSaving(true);
    try {
      const payload = { ...cvData };

      if (selectedFile) {
        const formData = new FormData();
        formData.append('cvPdf', selectedFile, selectedFile.name);
        const dataToSend = { ...payload };

        for (const key in dataToSend) {
          const value = dataToSend[key];
          if (['experiencia', 'educacion'].includes(key) || (typeof value === 'object' && value !== null)) {
            formData.append(key, JSON.stringify(value));
          } else if (value !== null && value !== undefined) {
            formData.append(key, value);
          }
        }
        await upsertMyCv(formData);
      } else {
        await upsertMyCvJson(payload);
      }

      setSnack({ open: true, severity: "success", msg: "Perfil guardado con éxito!" });
      await fetchAll();
      setSelectedFile(null);
      setActiveStep(0);
    } catch (e) {
      console.error(e);
      const errorMsg = e.response?.data?.message || "Error al guardar el perfil.";
      setSnack({ open: true, severity: "error", msg: errorMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => setActiveStep(p => p + 1);
  const handleBack = () => setActiveStep(p => p - 1);

  const getStepStatus = (index) => {
    if (loading || !cvData) return { completed: false, error: false };
    
    switch (index) {
      case 0: { // Datos Personales
        const age = calculateAge(cvData.nacimiento);
        const isAgeValid = cvData.nacimiento ? (age >= 18 && age <= 99) : false;
        const hasPersonal = !!(cvData.nombre && cvData.apellido && isAgeValid);
        return { completed: hasPersonal, error: !hasPersonal };
      }
      case 1: { // Contacto
        const hasDir = cvData.direccion && cvData.direccion.provincia && cvData.direccion.localidad;
        const hasContact = !!(cvData.email && cvData.telefono && hasDir);
        return { completed: hasContact, error: !hasContact };
      }
      case 2: { // Educación
        const hasEdu = cvData.educacion && cvData.educacion.length > 0;
        return { completed: hasEdu, error: !hasEdu };
      }
      case 3: { // Experiencia
        const hasExp = cvData.experiencia && cvData.experiencia.some(e => (e.puesto && e.puesto.trim()) || (e.empresa && e.empresa.trim()));
        return { completed: hasExp, error: false };
      }
      case 4: { // Adjuntar CV
        const hasFile = !!(cvData.cvFile || selectedFile);
        return { completed: hasFile, error: !hasFile };
      }
      default:
        return { completed: false, error: false };
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
      </Container>
    );
  }

  const getStepContent = (step) => {
    switch (step) {
      case 0: return <PersonalForm data={cvData} onChange={handleDataChange} reviewData={cvData} />;
      case 1: return <ContactLocationForm data={cvData} onFieldChange={handleDataChange} onDireccionChange={handleDireccionChange} reviewData={cvData} />;
      case 2: return <EducationForm data={cvData.educacion || []} onChange={handleEducationChange} reviewData={cvData} />;
      case 3: return <ExperienceForm data={cvData.experiencia || []} onChange={handleExperienceChange} reviewData={cvData} />;
      case 4: return (
        <UploadCV
          key={cvData.updatedAt || (cvData.cvFile?.fileName || cvData.cvFile?.filename || 'no-file')}
          existingFile={cvData.cvFile}
          lastUpdated={cvData.updatedAt}
          onFileSelect={setSelectedFile}
          reviewData={cvData}
          newFile={selectedFile}
        />
      );
      case 5: return <ReviewAndSaveForm data={cvData} newFile={selectedFile} />;
      default: return 'Paso desconocido';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, bgcolor: 'background.default' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => window.history.back()} sx={{ mb: 3 }}>Volver</Button>
      <Card sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>
          Configurar Perfil Profesional
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label, index) => {
            const { completed, error } = getStepStatus(index);
            const isActive = activeStep === index;
            return (
              <Step key={label} completed={completed}>
                <StepLabel 
                  error={error}
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontWeight: isActive ? 'bold' : 'normal',
                      color: isActive ? 'primary.main' : 'inherit',
                      transform: isActive ? 'scale(1.15)' : 'none',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
        <Box sx={{ minHeight: 400, p: 2 }}>
          {getStepContent(activeStep)}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
          <Button color="inherit" disabled={activeStep === 0 || isSaving} onClick={handleBack} sx={{ mr: 1 }}>
            Anterior
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          {activeStep === steps.length - 1 ? (
            <Button variant="contained" onClick={handleFinalSave} disabled={isSaving}>
              {isSaving ? <CircularProgress size={24} /> : 'Confirmar y Guardar'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Siguiente
            </Button>
          )}
        </Box>
      </Card>
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Container>
  );
}

// --- Componentes de Resumen (Review Cards) ---

const PersonalDataReviewCard = ({ data }) => (
  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
    <Typography variant="subtitle1" fontWeight="bold">Datos Personales:</Typography>
    <Typography>Nombre y Apellido: {data.nombre || '—'} {data.apellido || ''}</Typography>
    <Typography>Fecha de Nacimiento: {data.nacimiento ? new Date(data.nacimiento).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : '—'}</Typography>
    <Typography variant="subtitle2" fontWeight="bold" mt={1}>Resumen:</Typography>
    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', maxHeight: 150, overflow: 'auto' }}>{data.perfil || 'Aún no has añadido un resumen.'}</Typography>
  </Card>
);

const ContactDataReviewCard = ({ data }) => (
  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
    <Typography variant="subtitle1" fontWeight="bold">Contacto y Ubicación:</Typography>
    <Typography>Email: {data.email || '—'}</Typography>
    <Typography>LinkedIn: {data.linkedin || '—'}</Typography>
    <Typography>Teléfono: {data.telefono || '—'}</Typography>
    <Typography>
      Ubicación: {
        [
          (data.direccion?.localidad?.nombre ?? data.direccion?.localidad),
          data.direccion?.provincia?.nombre
        ].filter(Boolean).join(', ') || '—'
      }
    </Typography>
  </Card>
);

const EducationDataReviewCard = ({ data }) => (
  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
    <Typography variant="subtitle1" fontWeight="bold">Educación:</Typography>
    {data.educacion && data.educacion.length > 0 ? (
      data.educacion.map((edu, index) => (
        <Box key={index} sx={{ mt: index > 0 ? 1 : 0, mb: 1, borderBottom: index < data.educacion.length - 1 ? '1px solid #eee' : 'none', pb: 1 }}>
          <Typography><strong>Título:</strong> {edu.carrera || '—'}</Typography>
          <Typography><strong>Institución:</strong> {edu.institucion || '—'}</Typography>
          <Typography><strong>Nivel:</strong> {edu.nivelAcademico || '—'}</Typography>
        </Box>
      ))
    ) : (
      <Typography>No se ha añadido información académica.</Typography>
    )}
  </Card>
);

const ExperienceDataReviewCard = ({ data }) => (
  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
    <Typography variant="subtitle1" fontWeight="bold">Experiencia Laboral:</Typography>
    {data.experiencia && data.experiencia.length > 0 ? (
      data.experiencia.map((exp, index) => (
        <Box key={index} sx={{ mt: index > 0 ? 1 : 0, mb: 1, borderBottom: index < data.experiencia.length - 1 ? '1px solid #eee' : 'none', pb: 1 }}>
          <Typography><strong>Puesto:</strong> {exp.puesto || '—'}</Typography>
          <Typography><strong>Empresa:</strong> {exp.empresa || '—'}</Typography>
          <Typography><strong>Periodo:</strong> {exp.desde ? new Date(exp.desde).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : '...'} - {exp.hasta ? new Date(exp.hasta).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : 'Actualidad'}</Typography>
        </Box>
      ))
    ) : (
      <Typography>No se ha añadido experiencia laboral.</Typography>
    )}
  </Card>
);

const CvFileDataReviewCard = ({ data, newFile }) => {
  const fallbackName = data?.nombre ? `CV_${data.nombre.replace(/\s+/g, '_')}_${(data.apellido || '').replace(/\s+/g, '_')}.pdf` : "CV_Actual.pdf";
  
  return (
    <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Typography variant="subtitle1" fontWeight="bold">CV Adjunto:</Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography>
          {newFile ? `Nuevo: ${newFile.name}` : (data.cvFile?.fileName || data.cvFile?.filename || (data.cvFile?.providerId ? fallbackName : 'No hay un CV cargado.'))}
        </Typography>
        {(newFile || data.cvFile?.providerId) && <CheckCircleIcon color="success" fontSize="small" />}
      </Stack>
    </Card>
  );
};

// --- Componentes de Formulario ---

const PersonalForm = ({ data, onChange, reviewData }) => {
  const age = calculateAge(data.nacimiento);
  const isDateInvalid = data.nacimiento && (age < 18 || age > 99);
  const dateErrorText = isDateInvalid 
    ? (age < 18 ? "Debes ser mayor de 18 años." : "La edad no puede superar los 99 años.") 
    : "";

  return (
    <Fade in={true}>
      <Grid container spacing={4} wrap="wrap">
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            <Typography variant="h6" gutterBottom>Cuéntanos un poco sobre ti</Typography>
            <TextField label="Nombre *" value={data.nombre || ''} onChange={e => onChange('nombre', e.target.value)} fullWidth />
            <TextField label="Apellido" value={data.apellido || ''} onChange={e => onChange('apellido', e.target.value)} fullWidth />
            <TextField 
              type="date" 
              label="Fecha de nacimiento" 
              value={String(data.nacimiento || '').slice(0, 10)} 
              InputLabelProps={{ shrink: true }} 
              onChange={e => onChange('nacimiento', e.target.value)} 
              fullWidth 
              error={!!isDateInvalid}
              helperText={dateErrorText}
            />
            <TextField label="Resumen Profesional" multiline rows={4} value={data.perfil || ''} onChange={e => onChange('perfil', e.target.value)} fullWidth />
          </Stack>
        </Grid>
        <Grid item xs={12} md={5}>
          <Box sx={{ position: { md: 'sticky' }, top: 20 }}>
            <PersonalDataReviewCard data={reviewData} />
          </Box>
        </Grid>
      </Grid>
    </Fade>
  );
};

const ContactLocationForm = ({ data, onFieldChange, onDireccionChange, reviewData }) => (
  <Fade in={true}>
    <Grid container spacing={4}>
      <Grid item xs={12} md={7}>
        <Stack spacing={3}>
          <Typography variant="h6" gutterBottom>Información de Contacto y Ubicación</Typography>
          <TextField label="Email *" value={data.email || ''} onChange={e => onFieldChange('email', e.target.value)} fullWidth />
          <TextField label="Teléfono" value={data.telefono || ''} onChange={e => onFieldChange('telefono', e.target.value)} fullWidth />
          <TextField label="URL de LinkedIn" value={data.linkedin || ''} onChange={e => onFieldChange('linkedin', e.target.value)} fullWidth />
          <DireccionAR value={data.direccion || null} onChange={onDireccionChange} required />
        </Stack>
      </Grid>
      <Grid item xs={12} md={5}>
         <Box sx={{ position: { md: 'sticky' }, top: 20 }}>
            <ContactDataReviewCard data={reviewData} />
         </Box>
      </Grid>
    </Grid>
  </Fade>
);

const EducationForm = ({ data, onChange, reviewData }) => {
  const educations = data || [];
  const theme = useTheme();

  const addEducation = () => onChange([...educations, { nivelAcademico: '', carrera: '', institucion: '', desde: '', hasta: '' }]);
  const removeEducation = (idx) => onChange(educations.filter((_, i) => i !== idx));
  const updateEducation = (idx, field, value) => {
    const newEducations = educations.map((edu, i) => i === idx ? { ...edu, [field]: value } : edu);
    onChange(newEducations);
  };

  const getYearVal = (val) => {
    if (!val) return '';
    const d = new Date(val);
    return isNaN(d.getFullYear()) ? '' : d.getFullYear();
  };

  return (
    <Fade in={true}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" gutterBottom>Tu Trayectoria Académica</Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega tus estudios formales, cursos o certificaciones relevantes.
              </Typography>
            </Box>

            {educations.map((edu, idx) => (
              <Card 
                key={idx} 
                variant="outlined" 
                sx={{ 
                  p: 3, 
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: theme.shadows[2],
                    borderColor: 'primary.main'
                  }
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ 
                      width: 28, height: 28, borderRadius: '50%', 
                      bgcolor: 'primary.main', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.85rem', fontWeight: 'bold'
                    }}>
                      {idx + 1}
                    </Box>
                    <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                      Detalle del Estudio
                    </Typography>
                  </Stack>
                  <IconButton 
                    size="small" 
                    onClick={() => removeEducation(idx)} 
                    color="error"
                    sx={{ bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Nivel Académico"
                      value={edu.nivelAcademico || ''}
                      onChange={e => updateEducation(idx, 'nivelAcademico', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CertificateIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    >
                      {nivelesAcademicos.map(n => (
                        <MenuItem key={n} value={n}>{n}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Título / Carrera"
                      placeholder="Ej. Licenciatura en Finanzas"
                      value={edu.carrera || ''}
                      onChange={e => updateEducation(idx, 'carrera', e.target.value)}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SchoolIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Institución Educativa"
                      placeholder="Ej. Universidad de Buenos Aires"
                      value={edu.institucion || ''}
                      onChange={e => updateEducation(idx, 'institucion', e.target.value)}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Desde (Año)"
                      value={getYearVal(edu.desde)}
                      onChange={e => updateEducation(idx, 'desde', `${e.target.value}-01-01`)}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    >
                      {yearsList.map(y => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Hasta (Año)"
                      value={getYearVal(edu.hasta)}
                      onChange={e => updateEducation(idx, 'hasta', `${e.target.value}-01-01`)}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    >
                      {yearsList.map(y => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Card>
            ))}

            <Button 
              startIcon={<AddIcon />} 
              onClick={addEducation} 
              fullWidth
              variant="outlined" 
              sx={{ 
                borderStyle: 'dashed', 
                borderWidth: '2px',
                color: 'text.secondary',
                justifyContent: 'center',
                py: 1.5,
                '&:hover': {
                  borderWidth: '2px',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
            >
              Añadir otro estudio
            </Button>
          </Stack>
        </Grid>

        <Grid item xs={12} md={5}>
          <Box sx={{ position: { md: 'sticky' }, top: 20 }}>
            <EducationDataReviewCard data={reviewData} />
          </Box>
        </Grid>
      </Grid>
    </Fade>
  );
};

const ExperienceForm = ({ data, onChange, reviewData }) => {
  const experiences = data || [];
  const theme = useTheme(); // Para usar theme en sombras

  const addExperience = () => onChange([...experiences, { puesto: '', empresa: '', desde: '', hasta: '' }]);
  const removeExperience = (idx) => onChange(experiences.filter((_, i) => i !== idx));
  const updateExperience = (idx, field, value) => {
    const newExperiences = experiences.map((exp, i) => i === idx ? { ...exp, [field]: value } : exp);
    onChange(newExperiences);
  };

  return (
    <Fade in={true}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" gutterBottom>Tu Historial Laboral</Typography>
              <Typography variant="body2" color="text.secondary">
                Detalla tus experiencias laborales previas relevantes.
              </Typography>
            </Box>

            {experiences.map((exp, idx) => (
              <Card 
                key={exp._id || idx} 
                variant="outlined" 
                sx={{ 
                  p: 3, 
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: theme.shadows[2],
                    borderColor: 'primary.main'
                  }
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ 
                      width: 28, height: 28, borderRadius: '50%', 
                      bgcolor: 'primary.main', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.85rem', fontWeight: 'bold'
                    }}>
                      {idx + 1}
                    </Box>
                    <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                      Detalle de la Experiencia
                    </Typography>
                  </Stack>
                  <IconButton 
                    size="small" 
                    onClick={() => removeExperience(idx)} 
                    color="error"
                    sx={{ bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField 
                      label="Puesto / Título" 
                      value={exp.puesto || ''} 
                      onChange={e => updateExperience(idx, 'puesto', e.target.value)} 
                      fullWidth 
                      InputProps={{ startAdornment: (<InputAdornment position="start"><WorkIcon fontSize="small" color="action" /></InputAdornment>) }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      label="Empresa" 
                      value={exp.empresa || ''} 
                      onChange={e => updateExperience(idx, 'empresa', e.target.value)} 
                      fullWidth 
                      InputProps={{ startAdornment: (<InputAdornment position="start"><BusinessIcon fontSize="small" color="action" /></InputAdornment>) }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      type="date" 
                      label="Desde" 
                      value={String(exp.desde || '').slice(0, 10)} 
                      InputLabelProps={{ shrink: true }} 
                      onChange={e => updateExperience(idx, 'desde', e.target.value)} 
                      fullWidth 
                      InputProps={{ startAdornment: (<InputAdornment position="start"><CalendarIcon fontSize="small" color="action" /></InputAdornment>) }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      type="date" 
                      label="Hasta" 
                      value={String(exp.hasta || '').slice(0, 10)} 
                      InputLabelProps={{ shrink: true }} 
                      onChange={e => updateExperience(idx, 'hasta', e.target.value)} 
                      fullWidth 
                      InputProps={{ startAdornment: (<InputAdornment position="start"><CalendarIcon fontSize="small" color="action" /></InputAdornment>) }}
                    />
                  </Grid>
                </Grid>
              </Card>
            ))}
            
            <Button 
              startIcon={<AddIcon />} 
              onClick={addExperience} 
              fullWidth
              variant="outlined" 
              sx={{ 
                borderStyle: 'dashed', 
                borderWidth: '2px',
                color: 'text.secondary',
                justifyContent: 'center',
                py: 1.5,
                '&:hover': {
                  borderWidth: '2px',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
            >
              Añadir otra experiencia
            </Button>
          </Stack>
        </Grid>
        <Grid item xs={12} md={5}>
          <Box sx={{ position: { md: 'sticky' }, top: 20 }}>
            <ExperienceDataReviewCard data={reviewData} />
          </Box>
        </Grid>
      </Grid>
    </Fade>
  );
};

const UploadCV = ({ existingFile, lastUpdated, onFileSelect, reviewData, newFile }) => {
  const [selectedFileName, setSelectedFileName] = useState(newFile?.name || "");
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const fallbackName = reviewData?.nombre ? `CV_${reviewData.nombre.replace(/\s+/g, '_')}_${(reviewData.apellido || '').replace(/\s+/g, '_')}.pdf` : "CV_Actual.pdf";
  const existingFileName = existingFile?.fileName || existingFile?.filename || (existingFile?.providerId ? fallbackName : null);

  // Efecto para manejar la URL de previsualización
  useEffect(() => {
    if (newFile) {
      // Si hay un archivo nuevo local, creamos un Blob URL
      const objectUrl = URL.createObjectURL(newFile);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (existingFile?.providerId) {
      // Si es un archivo existente, NO usamos el preview de Google Drive (HTML)
      // sino que lo dejamos null aquí y lo cargamos bajo demanda al abrir el modal
      // para evitar llamadas innecesarias o problemas de CORS hasta que el usuario quiera verlo.
      // Sin embargo, para react-pdf necesitamos el binario. 
      // Si tu backend devuelve una URL firmada o directa, úsala.
      // Por ahora, dejaremos null y lo manejaremos en handleOpenPreview.
      setPreviewUrl(null);
    } else {
      setPreviewUrl(null);
    }
  }, [newFile, existingFile]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleOpenPreview = async () => {
    setOpenPreview(true);
    setPageNumber(1);

    // Si no hay archivo nuevo pero sí uno existente, intentamos obtener la URL de descarga
    if (!newFile && existingFile?.providerId && !previewUrl) {
      try {
        const { data } = await getMyCvDownloadUrlApi();
        if (data.downloadUrl) {
          setPreviewUrl(data.downloadUrl);
        }
      } catch (error) {
        console.error("Error al cargar PDF remoto:", error);
        // Fallback: si falla la carga binaria, quizás quieras mostrar un error 
        // o intentar abrirlo en otra pestaña.
      }
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { data } = await getMyCvDownloadUrlApi();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error("Error al obtener la URL de descarga:", error);
      alert("No se pudo obtener el enlace de descarga. Por favor, inténtalo de nuevo.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Fade in={true}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            <Typography variant="h6" gutterBottom>Adjunta tu CV (Formato PDF)</Typography>
            <Typography variant="body2" color="text.secondary">
              Si subes un nuevo archivo, reemplazará al existente cuando guardes tu perfil al final del proceso.
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
                {selectedFileName ? "Cambiar archivo" : "Seleccionar Archivo"}
                <VisuallyHiddenInput type="file" accept=".pdf" onChange={handleFileChange} />
              </Button>
            </Stack>

            {selectedFileName && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Nuevo archivo seleccionado: <strong>{selectedFileName}</strong>. Se guardará al final del proceso.
                {previewUrl && (
                  <Button 
                    size="small" 
                    startIcon={<VisibilityIcon />}
                    onClick={handleOpenPreview}
                    sx={{ display: 'block', mt: 1 }}
                  >
                    Ver Vista Previa
                  </Button>
                )}
              </Alert>
            )}

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Último CV cargado:
              </Typography>
              {existingFileName ? (
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                    <Link 
                      component="button" 
                      variant="body1" 
                      onClick={handleDownload} 
                      disabled={isDownloading}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}
                    >
                      {existingFileName} <DownloadIcon fontSize="small" />
                    </Link>
                    <CheckCircleIcon color="success" fontSize="small" />
                    {!selectedFileName && existingFile?.providerId && (
                      <IconButton onClick={handleOpenPreview} size="small" color="primary" title="Ver Vista Previa">
                        <VisibilityIcon />
                      </IconButton>
                    )}
                  </Stack>
                  {lastUpdated && (
                    <Typography variant="caption" color="text.secondary">
                      {new Date(lastUpdated).toLocaleDateString('es-AR')}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  No hay un CV cargado.
                </Typography>
              )}
            </Box>

            <Dialog open={openPreview} onClose={() => setOpenPreview(false)} fullWidth maxWidth="lg">
              <DialogContent sx={{ minHeight: '60vh', p: 2, bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {previewUrl ? (
                  <Document
                    file={previewUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<CircularProgress />}
                    error={
                      <Box textAlign="center" mt={4}>
                        <Typography color="error">No se pudo cargar la vista previa del PDF.</Typography>
                        <Typography variant="caption">Es posible que el archivo remoto no permita acceso directo (CORS).</Typography>
                      </Box>
                    }
                  >
                    <Page 
                      pageNumber={pageNumber} 
                      renderTextLayer={false} 
                      renderAnnotationLayer={false} 
                      width={Math.min(window.innerWidth * 0.8, 800)} // Responsive width
                    />
                  </Document>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                {numPages && (
                  <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', pl: 2 }}>
                    <Button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)}>Ant</Button>
                    <Typography variant="body2" sx={{ mx: 2 }}>Página {pageNumber} de {numPages}</Typography>
                    <Button disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)}>Sig</Button>
                  </Box>
                )}
                <Button onClick={() => setOpenPreview(false)}>Cerrar</Button>
              </DialogActions>
            </Dialog>
          </Stack>
        </Grid>
        <Grid item xs={12} md={5}>
          <CvFileDataReviewCard data={reviewData} newFile={newFile} />
        </Grid>
      </Grid>
    </Fade>
  );
};

const ReviewAndSaveForm = ({ data, newFile }) => (
  <Fade in={true}>
    <Stack spacing={3}>
      <Typography variant="h6" gutterBottom>Revisa que toda tu información sea correcta</Typography>
      <PersonalDataReviewCard data={data} />
      <ContactDataReviewCard data={data} />
      <EducationDataReviewCard data={data} />
      <ExperienceDataReviewCard data={data} />
      <CvFileDataReviewCard data={data} newFile={newFile} />
    </Stack>
  </Fade>
);