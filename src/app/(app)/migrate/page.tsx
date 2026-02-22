'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Cloud, HardDrive, ArrowRight, CheckCircle, AlertTriangle, Database } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { migrateLocalStorageToSupabase, hasLocalStorageData } from '@/lib/migrate-localStorage'
import { useToast } from '@/hooks/use-toast'

export default function MigratePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean
    migratedProjects: number
    errors: string[]
  } | null>(null)

  const hasLocalData = hasLocalStorageData()

  const handleMigration = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be authenticated to migrate your data.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await migrateLocalStorageToSupabase()
      setMigrationResult(result)

      if (result.success) {
        toast({
          title: 'Migration successful!',
          description: `${result.migratedProjects} projects were migrated to the cloud.`,
        })
      } else {
        toast({
          title: 'Migration completed with errors',
          description: `${result.migratedProjects} projects were migrated, but there were some errors.`,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Migration error',
        description: 'Could not complete the migration. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinue = () => {
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You must log in to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login')} className="w-full">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Database className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">
            Welcome to Kolearning in the Cloud!
          </CardTitle>
          <CardDescription className="text-lg">
            Now your projects automatically sync between devices
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Benefits Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-primary/10">
              <Cloud className="h-6 w-6 text-primary mt-1 shrink-0" />
              <div>
                <h3 className="font-semibold">Automatic Synchronization</h3>
                <p className="text-sm text-muted-foreground">
                  Access your projects from any device
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-primary/10">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 shrink-0" />
              <div>
                <h3 className="font-semibold">Secure Data</h3>
                <p className="text-sm text-muted-foreground">
                  Your data is protected with enterprise-level encryption
                </p>
              </div>
            </div>
          </div>

          {/* Migration Section */}
          {hasLocalData && !migrationResult && (
            <>
              <Alert>
                <HardDrive className="h-4 w-4" />
                <AlertDescription>
                  We detected project data saved locally in your browser.
                  Would you like to migrate them to the cloud to keep them safe?
                </AlertDescription>
              </Alert>

              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={handleContinue}>
                  Skip migration
                </Button>
                <Button onClick={handleMigration} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Migrating...
                    </>
                  ) : (
                    <>
                      Migrate data
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Migration Results */}
          {migrationResult && (
            <Alert className={migrationResult.success ? 'border-green-500' : 'border-yellow-500'}>
              {migrationResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    <strong>Migration completed:</strong> {migrationResult.migratedProjects} projects migrated
                  </p>
                  {migrationResult.errors.length > 0 && (
                    <div>
                      <p className="font-semibold">Errors found:</p>
                      <ul className="list-disc list-inside text-sm">
                        {migrationResult.errors.slice(0, 3).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {migrationResult.errors.length > 3 && (
                          <li>... and {migrationResult.errors.length - 3} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Continue Button */}
          {(!hasLocalData || migrationResult) && (
            <div className="flex justify-center">
              <Button onClick={handleContinue} size="lg">
                Continue to Kolearning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Info Section */}
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            <p>
              Kolearning now uses Supabase to store your data securely.
              If you have any questions, check our documentation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}