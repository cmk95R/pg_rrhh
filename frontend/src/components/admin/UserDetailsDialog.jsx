// c:\Users\CMK-DEV\Desktop\PriorityGroup\priority_group\frontend\src\components\UserDetailsDialog.jsx

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Avatar, Chip, Grid, Stack, CircularProgress
} from '@mui/material';
import { getCvByIdApi } from '../../api/cv';

export default function UserDetailsDialog({ open, onClose, user }) {
  const [fullUser, setFullUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const colorFont = "#084a70";

  useEffect(() => {
    if (open && user) {
      const loadDetails = async () => {
        setLoading(true);
        try {
          // Si el usuario tiene un CV asociado, cargamos los detalles completos
          if (user.cvId) {
            const { data } = await getCvByIdApi(user.cvId);
            const cvData = data.cv || {};

            // Fusionamos los datos del usuario base con los datos detallados del CV
            const enrichedUser = {
              ...user,
              ...cvData,
              // Normalizamos arrays para asegurar que el modal los lea bien
              experiencia: (cvData.experiencia || []).map(item => ({
                ...item,
                fechaInicio: item.desde || item.fechaInicio,
                fechaFin: item.hasta || item.fechaFin
              })),
              educacion: (cvData.educacion || []).map(item => ({
                ...item,
                fechaInicio: item.desde || item.fechaInicio,
                fechaFin: item.hasta || item.fechaFin,
                titulo: item.carrera || item.titulo
              })),
              sobreMi: cvData.perfil || cvData.sobreMi || user.sobreMi || "",
              fechaNacimiento: cvData.nacimiento || cvData.fechaNacimiento || user.fechaNacimiento,
              linkedin: cvData.linkedin || user.linkedin || "",
              cvFile: cvData.cvFile || user.cvFile
            };
            setFullUser(enrichedUser);
          } else {
            // Si no tiene CV, usamos los datos que ya tenemos
            setFullUser({
                ...user,
                experiencia: user.experiencia || [],
                educacion: user.educacion || []
            });
          }
        } catch (error) {
          console.error("Error cargando detalles del CV:", error);
          setFullUser(user); // Fallback al usuario básico si falla la API
        } finally {
          setLoading(false);
        }
      };
      loadDetails();
    } else {
        setFullUser(null); // Limpiamos al cerrar
    }
  }, [open, user]);

  // Usamos fullUser si está cargado, sino el user inicial para mostrar algo (o null)
  const selectedUser = fullUser || user;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle sx={{ bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: colorFont, fontSize: '1.5rem' }}>
            {`${selectedUser?.nombre?.[0] || ''}${selectedUser?.apellido?.[0] || ''}`.toUpperCase()}
          </Avatar>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {selectedUser?.nombre} {selectedUser?.apellido}
              </Typography>
              {selectedUser?.fechaNacimiento && (
                <Chip
                  label={`${(() => {
                    const birthDate = new Date(selectedUser.fechaNacimiento);
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                      age--;
                    }
                    return age;
                  })()} años`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {selectedUser?.email}
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto', display: { xs: 'none', sm: 'block' } }}>
            <Chip label={selectedUser?.rol} size="small" color={selectedUser?.rol === 'admin' ? 'secondary' : selectedUser?.rol === 'rrhh' ? 'info' : 'default'} sx={{ mr: 1, textTransform: 'uppercase' }} />
            <Chip label={selectedUser?.estado} size="small" color={selectedUser?.estado === 'activo' ? 'success' : 'error'} variant="outlined" sx={{ textTransform: 'uppercase' }} />
          </Box>
        </DialogTitle>
        <br />
        <DialogContent sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedUser && (
            <Grid container spacing={4} sx={{ justifyContent: 'space-around', mt: 0 }}>
              {/* Columna Izquierda: Información Personal y Contacto */}
              <Grid item xs={12} md={4} sx={{ borderRight: { md: '1px solid #f0f0f0' } }}>
                <Typography variant="h6" gutterBottom sx={{ color: colorFont, borderBottom: '2px solid #eee', pb: 1 }}>
                    Información Personal
                  </Typography>
                <Stack spacing={2} sx={{ mb: 3 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Nombre Completo</Typography>
                    <Typography variant="body2">{selectedUser.nombre} {selectedUser.apellido}</Typography>
                  </Box>
                 
                  {selectedUser.fechaNacimiento && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Fecha de Nacimiento</Typography>
                      <Typography variant="body2">{new Date(selectedUser.fechaNacimiento).toLocaleDateString('es-AR')}</Typography>
                      
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Email</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{selectedUser.email}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Dirección</Typography>
                    <Typography variant="body2">
                      {selectedUser.direccion ? (
                        typeof selectedUser.direccion === 'object'
                          ? ([
                              selectedUser.direccion.calle,
                              selectedUser.direccion.numero,
                              selectedUser.direccion.localidad,
                              selectedUser.direccion.provincia,
                              selectedUser.direccion.pais
                            ]
                            .map(field => (typeof field === 'object' && field !== null ? (field.nombre || field.label || '') : field))
                            .filter(Boolean).join(', ') || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Sin dirección registrada</span>)
                          : selectedUser.direccion
                      ) : (
                        <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Sin dirección registrada</span>
                      )}
                    </Typography>
                  </Box>
                  </Stack>

                  <Stack spacing={2} sx={{ mb: 3 }}> 
                  <Typography variant="h6" color="primary" gutterBottom sx={{ color: colorFont, borderBottom: '2px solid #eee', pb: 1 }}>
                    Contacto
                  </Typography>  
                  {selectedUser.telefono && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Teléfono</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }} >
                      {selectedUser.telefono || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Sin teléfono registrado</span>}
                    </Typography>
                  </Box>
               )}
                
                {selectedUser.linkedin && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">LinkedIn</Typography>
                  {selectedUser.linkedin ? (
                      <Typography variant="body2" component="a" href={selectedUser.linkedin.startsWith('http') ? selectedUser.linkedin : `https://${selectedUser.linkedin}`} target="_blank" rel="noopener noreferrer" sx={{ color: colorFont, textDecoration: 'none', '&:visited': { color: colorFont }, '&:hover': { textDecoration: 'underline' } }}>
                        Ver perfil
                      </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.7 }}>Sin LinkedIn registrado</Typography>
                  )}
                </Box>
                )} 
                  {/* Sección Datos Crudos (Fallback si no hay estructura de CV definida) */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="caption" color="text.secondary" display="block">Resumen Profesional</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line', color: 'text.primary' }}>
                    {(selectedUser.perfil || selectedUser.sobreMi) || <span style={{ fontStyle: 'italic', opacity: 0.7, fontSize: '0.875rem' }}>Sin resumen profesional</span>}
                  </Typography>
                </Box>
                </Stack>
              </Grid>

              {/* Columna Derecha: Perfil Profesional y Experiencia */}
              <Grid item xs={12} md={8}>
                {/* Sección Experiencia Laboral */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" color="primary" gutterBottom sx={{ color: colorFont, borderBottom: '2px solid #eee', pb: 1 }}>
                    Experiencia Laboral
                  </Typography>
                  {selectedUser.experiencia && selectedUser.experiencia.length > 0 ? (
                    <Stack spacing={2}>
                      {selectedUser.experiencia.map((exp, index) => (
                        <Box key={index}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {exp.puesto || exp.cargo || 'Puesto no especificado'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {exp.empresa || 'Empresa no especificada'} | {exp.fechaInicio ? new Date(exp.fechaInicio).getFullYear() : ''} - {exp.fechaFin ? new Date(exp.fechaFin).getFullYear() : 'Presente'}
                          </Typography>
                          {exp.descripcion && (
                            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                              {exp.descripcion}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Sin experiencia registrada
                    </Typography>
                  )}
                </Box>

                {/* Sección Educación */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" color="primary" gutterBottom sx={{ color: colorFont,borderBottom: '2px solid #eee', pb: 1 }}>
                    Educación
                  </Typography>
                  {selectedUser.educacion && selectedUser.educacion.length > 0 ? (
                    <Stack spacing={2}>
                      {selectedUser.educacion.map((edu, index) => (
                        <Box key={index}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {edu.titulo || edu.carrera || 'Título no especificado'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {edu.institucion || 'Institución no especificada'} | {edu.fechaInicio ? new Date(edu.fechaInicio).getFullYear() : ''} - {edu.fechaFin ? new Date(edu.fechaFin).getFullYear() : 'Presente'}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Sin educación registrada
                    </Typography>
                  )}
                </Box>

                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" color="primary" gutterBottom sx={{ color: colorFont, borderBottom: '2px solid #eee', pb: 1 }}>
                    CV Adjunto
                  </Typography>
                  {selectedUser.cvFile && selectedUser.cvFile.url ? (
                    <Button variant="outlined" size="medium" href={selectedUser.cvFile.url} target="_blank" sx={{ color: colorFont, mt: 0.5, textTransform: 'none', borderRadius: 2 }}>
                      Descargar PDF
                    </Button>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Sin CV cargado</Typography>
                  )}
                </Box>
               

              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
    </Dialog>
  );
}
