import { fetchCarScreenshot } from '@/lib/data'

export async function GET(request, { params }) {
   const { carId } = await params
   const screenshot = await fetchCarScreenshot(parseInt(carId, 10))

   if (!screenshot) {
      return new Response('Not found', { status: 404 })
   }

   return new Response(screenshot, {
      headers: {
         'Content-Type': 'image/png',
         'Cache-Control': 'public, max-age=86400, immutable',
      },
   })
}
