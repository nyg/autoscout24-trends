import { fetchCarPhotos } from '@/lib/data'


export async function GET(request, { params }) {
   const { carId } = await params
   const photos = await fetchCarPhotos(parseInt(carId, 10))
   return Response.json(photos.map(p => p.r2_url))
}
