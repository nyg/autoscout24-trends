import { fetchCarScreenshotUrl } from '@/lib/data'

export async function GET(request, { params }) {
   const { carId } = await params
   const url = await fetchCarScreenshotUrl(parseInt(carId, 10))

   if (!url) {
      return new Response('Not found', { status: 404 })
   }

   return Response.redirect(url, 302)
}
