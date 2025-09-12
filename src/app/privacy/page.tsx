import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Política de Privacidad</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p className="text-muted-foreground text-center">Última actualización: 4 de Septiembre de 2025</p>

          <h2>1. Información que Recopilamos</h2>
          <p>
            Recopilamos información que usted nos proporciona directamente, como cuando crea una cuenta, y la información que se genera a través de su uso del Servicio. Esto incluye:
            <ul>
              <li><strong>Información de la cuenta:</strong> Su nombre, dirección de correo electrónico y contraseña.</li>
              <li><strong>Contenido del Usuario:</strong> Los materiales de estudio que usted carga o crea.</li>
              <li><strong>Datos de Uso:</strong> Información sobre cómo interactúa con nuestro Servicio, como su progreso de aprendizaje, respuestas a preguntas y uso de funciones.</li>
            </ul>
          </p>

          <h2>2. Cómo Usamos la Información</h2>
          <p>
            Utilizamos la información que recopilamos para:
            <ul>
              <li>Proporcionar, mantener y mejorar nuestro Servicio.</li>
              <li>Personalizar su experiencia de aprendizaje.</li>
              <li>Comunicarnos con usted, incluyendo el envío de correos electrónicos relacionados con el servicio y, si lo ha aceptado, boletines informativos.</li>
              <li>Analizar el uso del Servicio para comprender y mejorar nuestra plataforma.</li>
            </ul>
          </p>

          <h2>3. Suscripción al Boletín</h2>
          <p>
            Si elige suscribirse a nuestro boletín, utilizaremos su dirección de correo electrónico para enviarle actualizaciones sobre nuevas funciones, consejos de estudio y noticias sobre Kolearning. Puede darse de baja de estas comunicaciones en cualquier momento haciendo clic en el enlace "cancelar suscripción" que se encuentra en la parte inferior de cada correo electrónico.
          </p>

          <h2>4. Intercambio de Información</h2>
          <p>
            No compartimos su información personal con terceros, excepto en las siguientes circunstancias:
            <ul>
              <li>Con su consentimiento.</li>
              <li>Para cumplir con las leyes o responder a procesos legales.</li>
              <li>Para proteger los derechos y la propiedad de Kolearning.</li>
            </ul>
          </p>

          <h2>5. Seguridad de los Datos</h2>
          <p>
            Tomamos medidas razonables para proteger su información contra pérdida, robo, uso indebido y acceso no autorizado.
          </p>

          <h2>6. Contáctenos</h2>
          <p>
            Si tiene alguna pregunta sobre esta Política de Privacidad, contáctenos en <a href="mailto:privacidad@kolearning.com">privacidad@kolearning.com</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
