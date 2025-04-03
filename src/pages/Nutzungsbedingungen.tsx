
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Nutzungsbedingungen() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="pl-0 flex items-center gap-2">
              <ArrowLeft size={16} />
              Zurück zur Startseite
            </Button>
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-6">Nutzungsbedingungen</h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <h2>1. Geltungsbereich</h2>
          <p>
            Diese Nutzungsbedingungen gelten für die Nutzung der Bot Search_AT Statusseite 
            (nachfolgend "Dienst" genannt). Mit der Nutzung des Dienstes erklären Sie sich 
            mit diesen Nutzungsbedingungen einverstanden.
          </p>
          
          <h2>2. Leistungsbeschreibung</h2>
          <p>
            Der Dienst bietet Echtzeitüberwachung und Statusinformationen für alle Bot Search_AT 
            Dienste und Anwendungen. Der Betreiber behält sich das Recht vor, den Dienst jederzeit 
            und ohne vorherige Ankündigung zu ändern oder einzustellen.
          </p>
          
          <h2>3. Nutzungsrechte</h2>
          <p>
            Der Dienst ist ausschließlich für die persönliche, nicht-kommerzielle Nutzung bestimmt. 
            Jede andere Nutzung, insbesondere die kommerzielle Verwertung, bedarf der vorherigen 
            schriftlichen Zustimmung des Betreibers.
          </p>
          
          <h2>4. Pflichten des Nutzers</h2>
          <p>
            Bei der Nutzung des Dienstes sind Sie verpflichtet:
          </p>
          <ul>
            <li>keine rechtswidrigen oder sittenwidrigen Inhalte zu verbreiten</li>
            <li>keine Schadsoftware, Viren oder andere schädliche Programme zu übertragen</li>
            <li>keine automatisierten Systeme oder Bots zu verwenden, um auf den Dienst zuzugreifen</li>
            <li>den Dienst nicht in einer Weise zu nutzen, die dessen Verfügbarkeit beeinträchtigen könnte</li>
          </ul>
          
          <h2>5. Haftungsbeschränkung</h2>
          <p>
            Der Betreiber haftet nicht für die ununterbrochene Verfügbarkeit des Dienstes. Er bemüht 
            sich jedoch, den Dienst möglichst unterbrechungsfrei anzubieten. Der Betreiber übernimmt 
            keine Haftung für Schäden, die durch die Nutzung des Dienstes entstehen, soweit dies 
            gesetzlich zulässig ist.
          </p>
          
          <h2>6. Datenschutz</h2>
          <p>
            Die Erhebung, Verarbeitung und Nutzung personenbezogener Daten erfolgt gemäß unserer 
            <Link to="/datenschutz" className="mx-1">Datenschutzerklärung</Link>. 
          </p>
          
          <h2>7. Änderungen der Nutzungsbedingungen</h2>
          <p>
            Der Betreiber behält sich das Recht vor, diese Nutzungsbedingungen jederzeit und ohne 
            Angabe von Gründen zu ändern. Die geänderten Nutzungsbedingungen werden auf der Website 
            veröffentlicht. Durch die fortgesetzte Nutzung des Dienstes nach Veröffentlichung der 
            geänderten Nutzungsbedingungen erklären Sie sich mit diesen einverstanden.
          </p>
          
          <h2>8. Schlussbestimmungen</h2>
          <p>
            Sollten einzelne Bestimmungen dieser Nutzungsbedingungen unwirksam sein oder werden, 
            berührt dies die Wirksamkeit der übrigen Bestimmungen nicht. Es gilt das Recht der 
            Republik Österreich unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist, soweit 
            gesetzlich zulässig, der Sitz des Betreibers.
          </p>
          
          <p className="mt-8 text-muted-foreground">Stand: Juli 2023</p>
        </div>
      </div>
    </PageLayout>
  );
}
