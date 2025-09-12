import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Términos y Condiciones</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p className="text-muted-foreground text-center">Última actualización: 4 de Septiembre de 2025</p>
          
          <h2>1. Aceptación de los Términos</h2>
          <p>
            Al acceder o utilizar Kolearning (el "Servicio"), usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de los términos, no podrá acceder al Servicio.
          </p>

          <h2>2. Descripción del Servicio</h2>
          <p>
            Kolearning es una plataforma de aprendizaje adaptativo que utiliza inteligencia artificial para ayudar a los usuarios a estudiar y retener información de manera más efectiva. El Servicio incluye tutoría estratégica, generación de material de estudio y seguimiento del progreso.
          </p>

          <h2>3. Cuentas de Usuario</h2>
          <p>
            Para utilizar la mayoría de las funciones del Servicio, debe registrarse para obtener una cuenta. Usted es responsable de mantener la confidencialidad de su cuenta y contraseña. Acepta notificar a Kolearning inmediatamente sobre cualquier uso no autorizado de su cuenta.
          </p>

          <h2>4. Contenido del Usuario</h2>
          <p>
            Usted conserva todos los derechos sobre cualquier material de estudio, texto o información que cargue o ingrese en el Servicio ("Contenido del Usuario"). Al proporcionar Contenido del Usuario, nos otorga una licencia mundial, no exclusiva, libre de regalías para usar, reproducir, modificar y distribuir dicho contenido con el único propósito de operar y proporcionar el Servicio.
          </p>

          <h2>5. Uso Aceptable</h2>
          <p>
            Usted se compromete a no utilizar el Servicio para ningún propósito ilegal o prohibido por estos Términos. No puede utilizar el Servicio de ninguna manera que pueda dañar, deshabilitar, sobrecargar o perjudicar el Servicio.
          </p>

          <h2>6. Terminación</h2>
          <p>
            Podemos suspender o cancelar su acceso al Servicio de inmediato, sin previo aviso ni responsabilidad, por cualquier motivo, incluido, entre otros, el incumplimiento de los Términos.
          </p>

          <h2>7. Cambios en los Términos</h2>
          <p>
            Nos reservamos el derecho, a nuestra entera discreción, de modificar o reemplazar estos Términos en cualquier momento. Le notificaremos sobre cualquier cambio publicando los nuevos Términos y Condiciones en esta página.
          </p>

          <h2>8. Contáctenos</h2>
          <p>
            Si tiene alguna pregunta sobre estos Términos, contáctenos en <a href="mailto:soporte@kolearning.com">soporte@kolearning.com</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
