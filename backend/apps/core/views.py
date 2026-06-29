"""Views for the core app."""

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """Liveness probe used to verify the stack is wired end-to-end."""

    permission_classes = [AllowAny]
    authentication_classes: list[type] = []

    @extend_schema(
        tags=["Health"],
        operation_id="health_check",
        summary="Liveness probe",
        responses={
            200: OpenApiResponse(description="Service is up."),
        },
    )
    def get(self, request: Request) -> Response:
        """Return a 200 response confirming the service is up.

        Args:
            request: The incoming HTTP request.

        Returns:
            A response with HTTP 200 and a small JSON status body.
        """
        return Response({"status": "ok"})
