import type { Team } from '@/models'

export interface RotationCourtPresentation {
  id: string
  number: number
  isUsable: boolean
  teams: {
    A: Team
    B: Team
  } | null
}
