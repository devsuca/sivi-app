from rest_framework.routers import DefaultRouter
from .views import CrachaViewSet

router = DefaultRouter()
router.register(r'crachas', CrachaViewSet)

urlpatterns = router.urls
