import factory
from factory.django import DjangoModelFactory
from faker import Faker

fake = Faker()


class UserFactory(DjangoModelFactory):
    class Meta:
        model = "authentication.User"

    email = factory.LazyFunction(fake.email)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        manager = cls._get_manager(model_class)
        password = kwargs.pop("password", "testpass123")
        return manager.create_user(password=password, **kwargs)
