import { fetchVehicleScreenshots } from '@/lib/data'

export async function GET(request, { params }) {
   const { vehicleId } = await params
   const { searchParams } = new URL(request.url)
   const searchId = parseInt(searchParams.get('searchId'), 10)

   if (!vehicleId || !searchId) {
      return new Response('Missing vehicleId or searchId', { status: 400 })
   }

   const screenshots = await fetchVehicleScreenshots(vehicleId, searchId)
   return Response.json(screenshots)
}
