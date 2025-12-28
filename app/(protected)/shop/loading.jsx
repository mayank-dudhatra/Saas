export default function ShopLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 w-64 bg-gray-200 rounded"></div>
        <div className="h-10 w-32 bg-gray-200 rounded"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="h-96 bg-gray-200 rounded-lg w-full"></div>
    </div>
  );
}